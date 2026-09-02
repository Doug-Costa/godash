import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/services/NotificationService';
import { compileTemplate } from '@/lib/services/providers/MailerProvider';

export class CampaignFlowExecutionService {
  static async process(enrollmentId: string, stepId: string) {
    const enrollment = await prisma.campaignEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        campaign: true,
        customer: { include: { person: true } },
        opportunity: true,
        flowExecution: true
      }
    });
    const step = await prisma.flowVersionStep.findUnique({ where: { id: stepId } });
    if (!enrollment || !step || !enrollment.flowExecution) return;
    if (!['RUNNING', 'PENDING'].includes(enrollment.status)) return;
    if (!['ACTIVE', 'TESTING'].includes(enrollment.campaign.status)) {
      await prisma.campaignEnrollment.update({ where: { id: enrollment.id }, data: { status: 'PAUSED', stopReason: 'CAMPAIGN_NOT_ACTIVE' } });
      return;
    }
    if (enrollment.customer.humanTakeover || enrollment.opportunity?.humanTakeover) {
      await prisma.campaignEnrollment.update({ where: { id: enrollment.id }, data: { status: 'PAUSED', stopReason: 'HUMAN_TAKEOVER' } });
      return;
    }
    if (enrollment.status === 'PENDING') {
      await prisma.campaignEnrollment.update({ where: { id: enrollment.id }, data: { status: 'RUNNING', startedAt: new Date() } });
    }

    const config = (step.config as Record<string, any>) || {};
    if (step.type === 'STOP') {
      await this.complete(enrollment.id, enrollment.flowExecution.id, 'STOP_STEP');
      return;
    }
    if (step.type === 'NEXT_FLOW' && step.nextFlowId) {
      await this.startNextFlow(enrollment.id, enrollment.flowExecution.id, step.nextFlowId);
      return;
    }
    if (step.type === 'ACTION') {
      if (enrollment.opportunityId && (step.targetStage || step.targetPipelineId)) {
        await prisma.opportunity.update({
          where: { id: enrollment.opportunityId },
          data: { stage: step.targetStage || undefined, pipelineId: step.targetPipelineId || undefined }
        });
      }
    }
    if (step.type === 'MESSAGE') {
      const template = step.templateId ? await prisma.template.findUnique({ where: { id: step.templateId } }) : null;
      const channel = (step.channel || template?.type || 'WHATSAPP').toUpperCase();
      const content = template?.content || config.messageTemplate || '';
      const subject = template?.subject || 'Mensagem';
      const person = enrollment.customer.person;
      const customerMetadata = (enrollment.customer.metadata as Record<string, any>) || {};
      const variables = {
        ...customerMetadata,
        customer: {
          fullName: person.fullName || customerMetadata.fullName || 'Doutor(a)',
          name: person.fullName || customerMetadata.fullName || 'Doutor(a)',
          email: person.email || customerMetadata.email || '',
          phone: person.phoneNumber || customerMetadata.phoneNumber || ''
        },
        campaign: { name: enrollment.campaign.name }
      };
      const recipient = channel === 'EMAIL' ? variables.customer.email : variables.customer.phone;
      if (!recipient || !content) throw new Error(`Passo ${step.order}: destinatário ou conteúdo ausente.`);
      const success = await NotificationService.sendTemplate(
        recipient,
        channel === 'EMAIL' ? 'EMAIL' : 'WHATSAPP',
        channel === 'EMAIL'
          ? { subject: compileTemplate(subject, variables), content: compileTemplate(content, variables) }
          : { content: compileTemplate(content, variables) },
        variables,
        channel === 'WHATSAPP' ? { provider: config.provider || 'EVOLUTION' } : undefined
      );
      await prisma.interaction.create({
        data: {
          customerId: enrollment.customerId,
          opportunityId: enrollment.opportunityId,
          text: `[Campanha ${enrollment.campaign.name}] ${compileTemplate(content, variables)}`,
          type: 'CAMPAIGN_AUTOMATION',
          channel,
          deliveryStatus: success ? 'SENT' : 'FAILED'
        }
      });
      if (!success) throw new Error(`Falha no envio do passo ${step.order}.`);
    }

    await prisma.campaignEnrollment.update({ where: { id: enrollment.id }, data: { currentStep: step.order } });
    const nextStep = await prisma.flowVersionStep.findFirst({
      where: { flowVersionId: step.flowVersionId, order: { gt: step.order } },
      orderBy: { order: 'asc' }
    });
    if (nextStep) {
      const relativeDelay = Math.max(0, (nextStep.delayMinutes || 0) - (step.delayMinutes || 0));
      const { automationQueue } = await import('@/lib/queue/automationQueue');
      await automationQueue.add('campaign-flow-step', { enrollmentId: enrollment.id, stepId: nextStep.id }, { delay: relativeDelay * 60_000 });
    } else {
      await this.complete(enrollment.id, enrollment.flowExecution.id, 'FLOW_COMPLETED');
    }
  }

  static async fail(enrollmentId: string, reason: string) {
    await prisma.campaignEnrollment.update({
      where: { id: enrollmentId },
      data: { status: 'FAILED', stopReason: reason }
    }).catch(() => undefined);
  }

  private static async complete(enrollmentId: string, executionId: string, reason: string) {
    await prisma.$transaction([
      prisma.flowExecution.update({ where: { id: executionId }, data: { status: 'COMPLETED', currentStepId: null } }),
      prisma.campaignEnrollment.update({ where: { id: enrollmentId }, data: { status: 'COMPLETED', completedAt: new Date(), stopReason: reason } })
    ]);
  }

  private static async startNextFlow(enrollmentId: string, executionId: string, nextFlowId: string) {
    const version = await prisma.flowVersion.findFirst({
      where: { flowId: nextFlowId, status: 'PUBLISHED' },
      include: { steps: { orderBy: { order: 'asc' } } },
      orderBy: { version: 'desc' }
    });
    if (!version) throw new Error('Próximo fluxo não possui versão publicada.');
    const enrollment = await prisma.campaignEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) return;
    const nextExecution = await prisma.$transaction(async tx => {
      await tx.flowExecution.update({ where: { id: executionId }, data: { status: 'COMPLETED', currentStepId: null } });
      const created = await tx.flowExecution.create({
        data: {
          flowId: nextFlowId,
          flowVersionId: version.id,
          customerId: enrollment.customerId,
          opportunityId: enrollment.opportunityId,
          status: 'RUNNING'
        }
      });
      await tx.campaignEnrollment.update({ where: { id: enrollmentId }, data: { flowExecutionId: created.id, currentStep: null } });
      return created;
    });
    const firstStep = version.steps[0];
    if (firstStep) {
      const { automationQueue } = await import('@/lib/queue/automationQueue');
      await automationQueue.add('campaign-flow-step', { enrollmentId, stepId: firstStep.id }, { delay: Math.max(0, (firstStep.delayMinutes || 0) * 60_000) });
    } else {
      await this.complete(enrollmentId, nextExecution.id, 'EMPTY_NEXT_FLOW');
    }
    return nextExecution;
  }
}
