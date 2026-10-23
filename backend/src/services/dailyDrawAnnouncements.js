import axios from 'axios';
import { Op } from 'sequelize';
import { DailyDraw, DailyDrawWinner, DailyDrawAnnouncement } from '../models/index.js';
import dailyDrawX from '../utils/dailyDrawX.cjs';
import winnerImage from '../utils/dailyDrawWinnerImage.cjs';
import cleanup from '../utils/dailyDrawXCleanup.cjs';
import { buildDailyDrawPublishedMessage, sendTelegramGroupMessage } from './telegramNotifications.js';

const { POST_URL, MEDIA_URL, MAX_ATTEMPTS, readConfig, authorizationHeader, createDispatcher } = dailyDrawX;
const { deleteUrl, createCleanup } = cleanup;

const cleanupRepository = {
  async listPublished() {
    const rows = await DailyDrawAnnouncement.findAll({
      where: { status: 'published' },
      include: [{ model: DailyDraw, as: 'draw', attributes: ['drawDate'] }],
      order: [['drawId', 'DESC']],
      limit: 50,
    });
    return rows.map((row) => row.get({ plain: true }));
  },
  async claimDelete(record) {
    const [count] = await DailyDrawAnnouncement.update({
      deleteStatus: 'deleting', deleteAttempts: (record.deleteAttempts || 0) + 1, deleteNextAttemptAt: null, deleteErrorCode: null,
    }, {
      where: { id: record.id, deleteStatus: record.deleteStatus ?? null, deleteAttempts: record.deleteAttempts || 0 },
    });
    return count === 1;
  },
  async finishDelete(id, values) {
    await DailyDrawAnnouncement.update(values, { where: { id, deleteStatus: 'deleting' } });
  },
};

function requestOptions(credentials, url, method = 'POST') {
  return {
    headers: {
      Authorization: authorizationHeader(credentials, undefined, undefined, url, method),
      'Content-Type': 'application/json',
    },
    timeout: 15_000,
    maxRedirects: 0,
  };
}

export const announcementRepository = {
  async loadDraw(drawId) {
    const draw = await DailyDraw.findByPk(drawId);
    if (!draw) return null;
    const winners = await DailyDrawWinner.findAll({ where: { drawId }, order: [['rank', 'ASC']] });
    return { draw, winners };
  },
  async ensure(drawId) {
    const [record] = await DailyDrawAnnouncement.findOrCreate({ where: { drawId } });
    return record.get({ plain: true });
  },
  async claim(record) {
    const [count] = await DailyDrawAnnouncement.update({
      status: 'sending', attempts: record.attempts + 1, nextAttemptAt: null, errorCode: null,
    }, {
      where: { id: record.id, status: record.status, attempts: record.attempts },
    });
    return count === 1;
  },
  async reject(record, errorCode) {
    await DailyDrawAnnouncement.update({
      status: 'failed', errorCode, nextAttemptAt: null,
    }, { where: { id: record.id, status: record.status, attempts: record.attempts } });
  },
  async finish(id, values) {
    const [count] = await DailyDrawAnnouncement.update(values, { where: { id, status: 'sending' } });
    if (count !== 1) throw new Error('Announcement state changed during publication');
  },
};

export async function announceDailyDraw(drawId) {
  let config;
  try {
    config = readConfig();
  } catch {
    console.error(`[daily-draw-x] draw=${drawId} DAILY_DRAW_X_CREDENTIALS_MISSING; draw and payouts unaffected`);
    try {
      const data = await announcementRepository.loadDraw(drawId);
      if (data?.draw.status === 'completed' && data.winners.length > 0) {
        const record = await announcementRepository.ensure(drawId);
        if (['pending', 'failed'].includes(record.status)) {
          await announcementRepository.reject(record, 'DAILY_DRAW_X_CREDENTIALS_MISSING');
        }
      }
    } catch {
      console.error(`[daily-draw-x] draw=${drawId} Could not record configuration failure; check announcement storage.`);
    }
    return { status: 'configuration-error' };
  }
  const dispatch = createDispatcher({
    repository: announcementRepository,
    config,
    renderImage: winnerImage.renderWinnerImage,
    upload: async (image, credentials) => {
      const response = await axios.post(MEDIA_URL, {
        media: image.toString('base64'),
        media_category: 'tweet_image',
      }, requestOptions(credentials, MEDIA_URL));
      const data = response.data?.data;
      if (response.data?.errors?.length ||
          (data?.processing_info && data.processing_info.state !== 'succeeded')) {
        throw new Error('X_MEDIA_NOT_READY');
      }
      return data?.id;
    },
    post: (text, credentials, mediaId) => axios.post(POST_URL, {
      text, media: { media_ids: [mediaId] },
    }, requestOptions(credentials, POST_URL)),
  });
  const result = await dispatch(drawId);
  if (result?.status === 'published') {
    await relayDailyDrawToTelegram(drawId);
    await cleanupSupersededAnnouncements();
  }
  return result;
}

export async function relayDailyDrawToTelegram(drawId) {
  try {
    const record = await DailyDrawAnnouncement.findOne({
      where: { drawId, status: 'published', telegramStatus: null, deleteStatus: null },
      include: [{ model: DailyDraw, as: 'draw', attributes: ['drawDate'] }],
    });
    if (!record) return;
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_GROUP_ID) {
      console.error(`[daily-draw-x] draw=${drawId} telegram_not_configured; link not shared`);
      return;
    }
    const message = buildDailyDrawPublishedMessage({ drawDate: record.draw?.drawDate, postId: record.postId });
    const [claimed] = await DailyDrawAnnouncement.update({
      telegramStatus: 'sending', telegramErrorCode: null,
    }, { where: { id: record.id, status: 'published', telegramStatus: null, deleteStatus: null } });
    if (claimed !== 1) return;
    const result = await sendTelegramGroupMessage(message);
    const [saved] = await DailyDrawAnnouncement.update({
      telegramStatus: result.sent ? 'sent' : 'failed',
      telegramNotifiedAt: result.sent ? new Date() : null,
      telegramErrorCode: result.sent ? null : result.reason,
    }, { where: { id: record.id, telegramStatus: 'sending' } });
    if (saved !== 1) throw new Error('Telegram notification state changed during delivery');
    if (result.sent) console.log(`[daily-draw-x] draw=${drawId} X link shared to Telegram`);
    else console.error(`[daily-draw-x] draw=${drawId} ${result.reason}; inspect Telegram before retrying`);
  } catch {
    console.error(`[daily-draw-x] draw=${drawId} Telegram relay failed; inspect notification state before recovery`);
  }
}

async function sweepTelegramAnnouncements() {
  const [staleCount] = await DailyDrawAnnouncement.update({
    telegramStatus: 'uncertain', telegramErrorCode: 'TELEGRAM_INTERRUPTED_SEND',
  }, {
    where: { telegramStatus: 'sending', updatedAt: { [Op.lt]: new Date(Date.now() - 5 * 60_000) } },
  });
  if (staleCount) console.error(`[daily-draw-x] ${staleCount} interrupted Telegram sends require reconciliation`);
  const records = await DailyDrawAnnouncement.findAll({
    where: { status: 'published', telegramStatus: null, deleteStatus: null },
    order: [['id', 'DESC']],
    limit: 20,
  });
  for (const record of records) await relayDailyDrawToTelegram(record.drawId);
}

export async function cleanupSupersededAnnouncements() {
  try {
    const config = readConfig();
    if (!config.deletePrevious) return { status: 'disabled', deleted: 0 };
    await DailyDrawAnnouncement.update({
      deleteStatus: 'failed', deleteErrorCode: 'X_DELETE_INTERRUPTED', deleteNextAttemptAt: new Date(),
    }, {
      where: { deleteStatus: 'deleting', updatedAt: { [Op.lt]: new Date(Date.now() - 5 * 60_000) } },
    });
    return await createCleanup({
      repository: cleanupRepository,
      config,
      remove: (postId, credentials) => {
        const url = deleteUrl(postId);
        return axios.delete(url, requestOptions(credentials, url, 'DELETE'));
      },
    })();
  } catch {
    console.error('[daily-draw-x] Cleanup failed; check configuration and announcement storage. No credentials logged.');
    return { status: 'error', deleted: 0 };
  }
}

export async function retryDailyDrawAnnouncements() {
  try {
    if (!readConfig().enabled) return;
    const [staleCount] = await DailyDrawAnnouncement.update({
      status: 'uncertain', errorCode: 'X_INTERRUPTED_DISPATCH', nextAttemptAt: null,
    }, {
      where: { status: 'sending', updatedAt: { [Op.lt]: new Date(Date.now() - 5 * 60_000) } },
    });
    if (staleCount) console.error(`[daily-draw-x] ${staleCount} interrupted dispatches require reconciliation`);
    const records = await DailyDrawAnnouncement.findAll({
      where: {
        attempts: { [Op.lt]: MAX_ATTEMPTS },
        [Op.or]: [
          { status: 'pending' },
          { status: 'failed', nextAttemptAt: { [Op.lte]: new Date() } },
        ],
      },
      order: [['id', 'ASC']],
      limit: 20,
    });
    for (const record of records) await announceDailyDraw(record.drawId);
    await cleanupSupersededAnnouncements();
    await sweepTelegramAnnouncements();
  } catch {
    console.error('[daily-draw-x] Retry sweep failed; check configuration and announcement storage. No credentials logged.');
  }
}

export function startDailyDrawAnnouncementRetries() {
  if (process.env.DAILY_DRAW_X_ENABLED !== 'true') return;
  const schedule = () => {
    const timer = setTimeout(async () => {
      await retryDailyDrawAnnouncements();
      schedule();
    }, 60_000);
    timer.unref();
  };
  retryDailyDrawAnnouncements().finally(schedule);
}
