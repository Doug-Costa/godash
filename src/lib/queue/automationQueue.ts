import { Queue } from 'bullmq';
import { redisConnection } from './connection';

export const automationQueue = new Queue('automation-queue', {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
