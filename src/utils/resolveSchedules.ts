import * as schedule from 'node-schedule';
import BotDataSource from '../dataSource.js';
import Consumed from '../entities/consumed.js';

/**
 * Ajoute la verification journaliere des planifications
 */
export default function setupSchedulesResolver() {
  schedule.scheduleJob('* * 12 * * *', () => {
    BotDataSource.mongoManager.updateMany(
      Consumed,
      {
        scheduled_date: {
          $lte: '$$NOW',
        },
      },
      { $unset: { scheduled_date: '' } }
    );
  });
}
