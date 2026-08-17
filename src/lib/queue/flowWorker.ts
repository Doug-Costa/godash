import { Worker, Job } from 'bullmq';
import { redisConnection } from './connection';
import { PrismaClient } from '@prisma/client';
import { flowQueue } from './flowQueue';
import { mailQueue } from './mailQueue';
import { DomainEventService } from '../services/DomainEventService';

const prisma = new PrismaClient();

export const flowWorker = new Worker(
  'flow-queue',
  async (job: Job) => {
    const { flowExecutionId, stepId } = job.data;
    if (!flowExecutionId || !stepId) {
      console.error('[FlowWorker] Missing required data', job.data);
      return;
    }

    const execution = await prisma.flowExecution.findUnique({
      where: { id: flowExecutionId },
      include: { flow: true, customer: true }
    });

    if (!execution || execution.status !== 'RUNNING') {
      console.log(`[FlowWorker] Execution ${flowExecutionId} not running or not found.`);
      return;
    }

    const step = await prisma.flowStep.findUnique({
      where: { id: stepId },
    });

    if (!step) {
      console.error(`[FlowWorker] Step ${stepId} not found.`);
      return;
    }

    console.log(`[FlowWorker] Processing Execution ${flowExecutionId} | Step: ${step.type}`);

    try {
      if (step.type === 'DELAY' && step.delayMinutes) {
        // Enfileirar o próximo passo com o delay definido
        if (step.nextStepId) {
          console.log(`[FlowWorker] Delaying next step ${step.nextStepId} for ${step.delayMinutes} minutes`);
          await flowQueue.add('advance_step', {
            flowExecutionId,
            stepId: step.nextStepId
          }, {
            delay: step.delayMinutes * 60 * 1000
          });
        }
        
        // Atualizar execution currentStepId para o delay ou para o proximo
        await prisma.flowExecution.update({
          where: { id: flowExecutionId },
          data: { currentStepId: step.nextStepId }
        });
        
        return { status: 'delayed', nextStepId: step.nextStepId };
      }

      if (step.type === 'MESSAGE' && step.templateId) {
        const template = await prisma.template.findUnique({
          where: { id: step.templateId }
        });

        if (template) {
          if (template.type === 'WHATSAPP') {
            // MOCK WhatsApp
            console.log(`[FlowWorker] MOCK WhatsApp for Customer ${execution.customerId}`);
            await DomainEventService.publish({
              type: 'WHATSAPP_SENT',
              actorType: 'AUTOMATION',
              customerId: execution.customerId,
              opportunityId: execution.opportunityId || undefined,
              metadata: {
                status: 'MOCKED_WAITING_META',
                templateId: template.id,
                templateName: template.name
              }
            });
          } else if (template.type === 'EMAIL') {
            // Na Fase 2 a configuração de SMTP precisa ser acoplada ao Flow. 
            // Por enquanto usaremos null, pois o mailQueue aceita fallback.
            const smtpConfigId = null;

            // SEND TO MAIL QUEUE
            console.log(`[FlowWorker] Queuing EMAIL for Customer ${execution.customerId}`);
            await mailQueue.add('send_email', {
              customerId: execution.customerId,
              opportunityId: execution.opportunityId,
              templateId: template.id,
              smtpConfigId: smtpConfigId,
              flowExecutionId: execution.id
            });
          }
        }
      }

      if (step.type === 'ACTION') {
        if (execution.opportunityId && step.targetStage) {
          await prisma.opportunity.update({
            where: { id: execution.opportunityId },
            data: { stage: step.targetStage }
          });
          
          await DomainEventService.publish({
            type: 'OPPORTUNITY_STAGE_CHANGED',
            actorType: 'AUTOMATION',
            customerId: execution.customerId,
            opportunityId: execution.opportunityId,
            metadata: {
              source: 'FLOW_ACTION',
              targetStage: step.targetStage
            }
          });
        }
      }

      // Advance to Next Step Immediately if no delay
      if (step.nextStepId && step.type !== 'DELAY') {
        await flowQueue.add('advance_step', {
          flowExecutionId,
          stepId: step.nextStepId
        });
        await prisma.flowExecution.update({
          where: { id: flowExecutionId },
          data: { currentStepId: step.nextStepId }
        });
      } else if (!step.nextStepId && step.type !== 'DELAY') {
        // Complete execution
        await prisma.flowExecution.update({
          where: { id: flowExecutionId },
          data: { status: 'COMPLETED', currentStepId: null }
        });
        
        await DomainEventService.publish({
          type: 'FLOW_COMPLETED',
          actorType: 'AUTOMATION',
          customerId: execution.customerId,
          opportunityId: execution.opportunityId || undefined,
          metadata: { flowId: execution.flowId }
        });
      }

      return { status: 'success' };
    } catch (err: any) {
      console.error(`[FlowWorker] Error processing step:`, err);
      // Fails execution
      await prisma.flowExecution.update({
        where: { id: flowExecutionId },
        data: { status: 'FAILED' }
      });
      throw err;
    }
  },
  {
    connection: redisConnection as any,
    concurrency: 5,
  }
);
