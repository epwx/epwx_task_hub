import axios from 'axios';
import { Op } from 'sequelize';
import { DailyDraw, DailyDrawWinner, DailyDrawAnnouncement } from '../models/index.js';
import dailyDrawX from '../utils/dailyDrawX.cjs';

const { POST_URL, MAX_ATTEMPTS, readConfig, authorizationHeader, createDispatcher } = dailyDrawX;

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
    post: (text, credentials) => axios.post(POST_URL, { text }, {
      headers: {
        Authorization: authorizationHeader(credentials),
        'Content-Type': 'application/json',
      },
      timeout: 15_000,
      maxRedirects: 0,
    }),
  });
  return dispatch(drawId);
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
