import { Worker } from 'bullmq';
import { redisConnection } from './connection';
import prisma from '../prisma';

export const postSalesWorker = new Worker('PostSalesAlerts', async (job) => {
  if (job.name === 'sync-daily') {
    console.log('[Worker] Iniciando varredura de pós-vendas...');
    try {
      // 1. Buscamos todas as tarefas expirando ou novas vendas para gerar novos TaskAlerts no CRM
      // Mais adiante integraremos as campanhas e rodízios
      console.log('[Worker] Varredura executada.');
    } catch (err) {
      console.error('[Worker] Erro durante o processamento do sync-daily:', err);
      throw err;
    }
    console.log('[Worker] Varredura concluída com sucesso.');
  }
}, { connection: redisConnection as any });

postSalesWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} falhou:`, err);
});

console.log('[Worker] BullMQ Worker registrado e escutando na fila PostSalesAlerts...');
export default postSalesWorker;
