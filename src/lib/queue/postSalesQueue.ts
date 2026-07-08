import { Queue } from 'bullmq';
import { redisConnection } from './connection';

export const postSalesQueue = new Queue('PostSalesAlerts', {
  connection: redisConnection as any,
});

export async function schedulePostSalesSync() {
  await postSalesQueue.add('sync-daily', {}, { 
    jobId: 'daily-post-sales-sync',
    removeOnComplete: true 
  });
}
