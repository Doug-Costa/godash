import { Worker } from 'bullmq';
import { redisConnection } from './connection';
import prisma from '../prisma';

export const postSalesWorker = new Worker('PostSalesAlerts', async (job) => {
  if (job.name === 'sync-daily') {
    console.log('[Worker] Iniciando varredura diária de jornadas e relacionamento...');
    try {
      // 1. Buscar todas as jornadas ativas
      const activeJourneys = await prisma.journey.findMany({
        where: { status: 'ACTIVE' },
        include: { automations: true }
      });

      console.log(`[Worker] Encontradas ${activeJourneys.length} jornadas ativas para processar.`);

      for (const journey of activeJourneys) {
        // 2. Buscar todos os clientes vinculados à jornada com data de entrada definida, ignorando finalizados (ganho/perdido)
        const customers = await prisma.customer.findMany({
          where: {
            journeyId: journey.id,
            joinedJourneyAt: { not: null },
            assigneeId: { not: null },
            stage: { notIn: ['ganho', 'perdido'] }
          }
        });

        console.log(`[Worker] Processando ${customers.length} clientes para a jornada "${journey.name}"...`);

        const now = new Date();

        for (const customer of customers) {
          for (const automation of journey.automations) {
            const config = automation.actionConfig as any;
            const dayOffset = typeof config?.dayOffset === 'number' ? config.dayOffset : 0;
            const channel = config?.channel || 'WHATSAPP';

            // Calcular data agendada do passo (joinedJourneyAt + dayOffset)
            const joined = new Date(customer.joinedJourneyAt!);
            const scheduledFor = new Date(joined.getTime());
            scheduledFor.setDate(joined.getDate() + dayOffset);

            // Se o momento agendado já chegou ou passou
            if (scheduledFor <= now) {
              // Verificar se já existe uma tarefa gerada para esta automação específica
              const existingTask = await prisma.task.findFirst({
                where: {
                  customerId: customer.id,
                  automationId: automation.id
                }
              });

              if (!existingTask) {
                console.log(`[Worker] Criando tarefa para Cliente ID ${customer.id}, Automação ID ${automation.id} (Offset: +${dayOffset} dias)`);
                await prisma.task.create({
                  data: {
                    customerId: customer.id,
                    assignedToId: customer.assigneeId!,
                    journeyId: journey.id,
                    automationId: automation.id,
                    scheduledFor,
                    taskType: channel, // "WHATSAPP" | "EMAIL" | "CALL"
                    status: 'PENDING'
                  }
                });
              }
            }
          }
        }
      }

      console.log('[Worker] Varredura diária de jornadas concluída.');
    } catch (err) {
      console.error('[Worker] Erro durante o processamento do sync-daily:', err);
      throw err;
    }
  }
}, { connection: redisConnection as any });

postSalesWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} falhou:`, err);
});

console.log('[Worker] BullMQ Worker registrado e escutando na fila PostSalesAlerts...');
export default postSalesWorker;
