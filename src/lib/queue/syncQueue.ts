import { Queue } from 'bullmq';
import { redisConnection } from './connection';

export const syncQueue = new Queue('CustomerSyncQueue', {
  connection: redisConnection as any,
});

export async function scheduleCustomerSync() {
  await syncQueue.add('sync-customers', {}, {
    jobId: 'daily-customer-sync',
    removeOnComplete: true,
  });
}
