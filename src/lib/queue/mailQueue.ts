import { Queue } from 'bullmq';
import { redisConnection } from './connection';

export const mailQueue = new Queue('mail-queue', {
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
