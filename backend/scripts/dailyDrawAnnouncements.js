import 'dotenv/config';
import { Op } from 'sequelize';
import { DailyDrawAnnouncement } from '../src/models/index.js';

const [command, drawIdText, confirmation] = process.argv.slice(2);
const sequelize = DailyDrawAnnouncement.sequelize;

try {
  if (command === 'list') {
    const rows = await DailyDrawAnnouncement.findAll({
      attributes: ['drawId', 'status', 'attempts', 'postId', 'errorCode', 'nextAttemptAt', 'updatedAt'],
      order: [['id', 'DESC']],
      limit: 50,
      raw: true,
    });
    console.table(rows);
  } else {
    const drawId = Number(drawIdText);
    if (!Number.isSafeInteger(drawId) || drawId <= 0 ||
        !['published', 'retry'].includes(command)) {
      throw new Error('Usage: node scripts/dailyDrawAnnouncements.js list | published DRAW_ID POST_ID | retry DRAW_ID --confirmed-no-post');
    }
    if (process.env.DAILY_DRAW_X_ENABLED === 'true') {
      throw new Error('Disable DAILY_DRAW_X_ENABLED and stop/reload all backend instances before reconciliation.');
    }
    let values;
    if (command === 'published' && /^\d+$/.test(confirmation || '')) {
      values = { status: 'published', postId: confirmation, publishedAt: new Date(), nextAttemptAt: null, errorCode: null };
    } else if (command === 'retry' && confirmation === '--confirmed-no-post') {
      values = { status: 'pending', attempts: 0, postId: null, publishedAt: null, nextAttemptAt: null, errorCode: null };
    } else {
      throw new Error('Provide the existing X POST_ID, or --confirmed-no-post only after verifying that no announcement exists on X.');
    }
    const [count] = await DailyDrawAnnouncement.update(values, {
      where: { drawId, status: { [Op.in]: ['pending', 'sending', 'uncertain', 'failed'] } },
    });
    if (count !== 1) throw new Error('No recoverable announcement found for that draw; published records are not changed.');
    console.log(`Reconciled announcement for draw=${drawId}; status=${values.status}. No X request was made.`);
  }
} catch (error) {
  // Database errors can contain connection details or SQL; print only known operator messages.
  console.error(error.name === 'Error' ? error.message : 'Announcement operation failed; check database access and migration status.');
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
