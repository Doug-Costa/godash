import { Worker } from 'bullmq';
import { redisConnection } from './connection';
import prisma from '../prisma';

export const postSalesWorker = new Worker('PostSalesAlerts', async (job) => {
  if (job.name === 'sync-daily') {
    console.log('[Worker] Iniciando varredura diária de campanhas e relacionamento...');
    try {
      // 1. Buscar todas as campanhas ativas
      const activeCampaigns = await prisma.campaign.findMany({
        where: { status: 'ACTIVE' },
        include: { flowSteps: true }
      });

      console.log(`[Worker] Encontradas ${activeCampaigns.length} campanhas ativas para processar.`);

      for (const campaign of activeCampaigns) {
        // 2. Buscar todos os leads vinculados à campanha com data de entrada definida, ignorando finalizados (ganho/perdido)
        const leads = await prisma.leadState.findMany({
          where: {
            campaignId: campaign.id,
            joinedCampaignAt: { not: null },
            assigneeId: { not: null },
            stage: { notIn: ['ganho', 'perdido'] }
          }
        });

        console.log(`[Worker] Processando ${leads.length} leads para a campanha "${campaign.name}"...`);

        const now = new Date();

        for (const lead of leads) {
          for (const step of campaign.flowSteps) {
            // Calcular data agendada do passo (joinedCampaignAt + dayOffset)
            const joined = new Date(lead.joinedCampaignAt!);
            const scheduledFor = new Date(joined.getTime());
            scheduledFor.setDate(joined.getDate() + step.dayOffset);

            // Se o momento agendado já chegou ou passou
            if (scheduledFor <= now) {
              // Verificar se já existe um alerta gerado para este passo específico
              const existingAlert = await prisma.taskAlert.findFirst({
                where: {
                  leadStateId: lead.id,
                  stepId: step.id
                }
              });

              if (!existingAlert) {
                console.log(`[Worker] Criando alerta de tarefa para LeadState ID ${lead.id}, Passo ID ${step.id} (Offset: +${step.dayOffset} dias)`);
                await prisma.taskAlert.create({
                  data: {
                    leadStateId: lead.id,
                    assignedToId: lead.assigneeId!,
                    stepId: step.id,
                    scheduledFor,
                    taskType: step.channel, // "WHATSAPP" | "EMAIL" | "CALL"
                    status: 'PENDING'
                  }
                });
              }
            }
          }
        }
      }

      console.log('[Worker] Varredura diária de campanhas concluída.');
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
