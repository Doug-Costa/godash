import prisma from '@/lib/prisma';
import { CanonicalIdentityService } from '@/lib/services/CanonicalIdentityService';
import { CampaignPolicyService } from '@/lib/services/CampaignPolicyService';

type CampaignNature = 'COMMERCIAL' | 'AUTOMATED';
type RoutingMode = 'ROUND_ROBIN' | 'POOL' | 'FIXED';

export interface CampaignDraftInput {
  name: string;
  description?: string | null;
  objective?: string;
  campaignNature: CampaignNature;
  productId?: string | null;
  pipelineId?: string | null;
  flowId?: string | null;
  targetCriteria?: unknown;
  routingMode?: RoutingMode;
  useAccountManager?: boolean;
  strictSkillMatch?: boolean;
  operatorIds?: string[];
  initialStage?: string;
  limitPerDay?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  excludeNurturing?: boolean;
}

export class CampaignOrchestrationService {
  static async saveFlow(input: {
    id?: string;
    name: string;
    description?: string | null;
    category?: string;
    graph?: unknown;
    publish?: boolean;
    steps: Array<{
      type?: string;
      channel?: string | null;
      templateId?: string | null;
      delayMinutes?: number | null;
      dayOffset?: number | null;
      targetPipelineId?: string | null;
      targetStage?: string | null;
      nextFlowId?: string | null;
      config?: Record<string, unknown>;
      messageTemplate?: string;
      provider?: string;
    }>;
  }) {
    return prisma.$transaction(async tx => {
      const flow = input.id
        ? await tx.flow.update({ where: { id: input.id }, data: { name: input.name, description: input.description, category: input.category } })
        : await tx.flow.create({ data: { name: input.name, description: input.description, category: input.category || 'MARKETING', status: 'ACTIVE' } });

      const latest = await tx.flowVersion.aggregate({ where: { flowId: flow.id }, _max: { version: true } });
      const version = (latest._max.version || 0) + 1;
      if (input.publish !== false) {
        await tx.flowVersion.updateMany({ where: { flowId: flow.id, status: 'PUBLISHED' }, data: { status: 'ARCHIVED' } });
      }
      const flowVersion = await tx.flowVersion.create({
        data: {
          flowId: flow.id,
          version,
          status: input.publish === false ? 'DRAFT' : 'PUBLISHED',
          graph: (input.graph || {}) as any,
          publishedAt: input.publish === false ? null : new Date(),
          steps: {
            create: input.steps.map((step, index) => ({
              type: step.type || (step.channel ? 'MESSAGE' : 'ACTION'),
              order: index + 1,
              channel: step.channel || null,
              templateId: step.templateId || null,
              delayMinutes: step.delayMinutes ?? ((step.dayOffset || 0) * 24 * 60),
              targetPipelineId: step.targetPipelineId || null,
              targetStage: step.targetStage || null,
              nextFlowId: step.nextFlowId || null,
              config: {
                ...(step.config || {}),
                messageTemplate: step.messageTemplate || '',
                provider: step.provider || 'EVOLUTION'
              }
            }))
          }
        },
        include: { steps: { orderBy: { order: 'asc' } } }
      });
      return { flow, version: flowVersion };
    });
  }

  static async saveDraft(input: CampaignDraftInput, campaignId?: string) {
    return prisma.$transaction(async tx => {
      const publishedVersion = input.flowId
        ? await tx.flowVersion.findFirst({ where: { flowId: input.flowId, status: 'PUBLISHED' }, orderBy: { version: 'desc' } })
        : null;
      const data = {
        name: input.name,
        description: input.description || null,
        objective: input.objective || (input.campaignNature === 'COMMERCIAL' ? 'Venda' : 'Relacionamento'),
        campaignNature: input.campaignNature,
        status: 'DRAFT',
        productId: input.productId || null,
        pipelineId: input.pipelineId || null,
        flowId: input.flowId || null,
        flowVersionId: publishedVersion?.id || null,
        targetCriteria: input.targetCriteria ? JSON.stringify(input.targetCriteria) : null,
        routingMode: input.routingMode || 'ROUND_ROBIN',
        useAccountManager: input.useAccountManager === true,
        strictSkillMatch: input.strictSkillMatch === true,
        initialStage: input.initialStage || 'novo_cadastro',
        limitPerDay: input.limitPerDay || null,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        excludeNurturing: input.excludeNurturing !== false
      };
      const campaign = campaignId
        ? await tx.campaign.update({ where: { id: campaignId }, data })
        : await tx.campaign.create({ data });
      if (input.operatorIds) {
        await tx.campaignOperator.deleteMany({ where: { campaignId: campaign.id } });
        if (input.operatorIds.length) {
          await tx.campaignOperator.createMany({
            data: [...new Set(input.operatorIds)].map(userId => ({ campaignId: campaign.id, userId }))
          });
        }
      }
      return tx.campaign.findUnique({
        where: { id: campaign.id },
        include: { flow: true, flowVersion: true, pipeline: true, product: true, operators: { include: { user: true } } }
      });
    });
  }

  private static async resolveAudience(customerIds: Array<string | number>) {
    const resolved: string[] = [];
    for (const rawId of customerIds) {
      const externalId = typeof rawId === 'number' ? rawId : rawId.startsWith('ext_') ? Number(rawId.slice(4)) : null;
      if (externalId !== null && Number.isFinite(externalId)) {
        let customer = await prisma.customer.findFirst({ where: { externalPersonId: externalId } });
        if (!customer) {
          const person = await CanonicalIdentityService.resolve({ source: 'DENTALGO', externalId: String(externalId) });
          customer = await prisma.customer.create({ data: { personId: person.id, externalPersonId: externalId, source: 'DENTALGO' } });
        }
        resolved.push(customer.id);
      } else if (typeof rawId === 'string') {
        resolved.push(rawId);
      }
    }
    return [...new Set(resolved)];
  }

  static async preflight(campaignId: string, customerIds: Array<string | number> = []) {
    const resolvedCustomerIds = await this.resolveAudience(customerIds);
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { flowVersion: { include: { steps: true } }, pipeline: true, operators: { include: { user: true } } }
    });
    if (!campaign) throw new Error('Campanha não encontrada.');
    const errors: string[] = [];
    const warnings: string[] = [];
    errors.push(...CampaignPolicyService.validate({
      campaignNature: campaign.campaignNature,
      pipelineId: campaign.pipelineId,
      routingMode: campaign.routingMode,
      hasPublishedFlow: campaign.flowVersion?.status === 'PUBLISHED',
      flowStepCount: campaign.flowVersion?.steps.length || 0,
      operators: campaign.operators.map(item => ({ id: item.userId, isActive: item.user.isActive }))
    }));
    const invalidMessages = (campaign.flowVersion?.steps || []).filter(step => {
      if (step.type !== 'MESSAGE') return false;
      const config = (step.config as Record<string, any>) || {};
      return !step.channel || (!step.templateId && !config.messageTemplate);
    }).length;
    if (invalidMessages) errors.push(`${invalidMessages} passo(s) de mensagem estão sem canal, template ou conteúdo.`);
    const messageSteps = (campaign.flowVersion?.steps || []).filter(step => step.type === 'MESSAGE');
    if (messageSteps.some(step => step.channel === 'EMAIL')) {
      const activeSmtp = await prisma.smtpConfig.count({ where: { active: true } });
      if (!activeSmtp && !process.env.SMTP_HOST && !process.env.SMTP_SERVICE_URL) {
        errors.push('O fluxo usa e-mail, mas não existe SMTP ativo ou configurado.');
      }
    }
    for (const step of messageSteps.filter(item => item.channel === 'WHATSAPP')) {
      const provider = ((step.config as any)?.provider || 'EVOLUTION').toUpperCase();
      const configured = provider === 'ZAPI'
        ? !!(process.env.ZAPI_API_URL && process.env.ZAPI_API_TOKEN && process.env.ZAPI_API_INSTANCE)
        : provider === 'META'
          ? !!(process.env.META_API_TOKEN && process.env.META_PHONE_NUMBER_ID)
          : !!(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY && process.env.EVOLUTION_API_INSTANCE);
      if (!configured) errors.push(`O provedor WhatsApp ${provider} não está configurado.`);
    }
    if (!resolvedCustomerIds.length) warnings.push('A campanha ainda não possui audiência selecionada.');
    const customers = resolvedCustomerIds.length
      ? await prisma.customer.findMany({
          where: { id: { in: resolvedCustomerIds } },
          select: { id: true, personId: true, isInNurturing: true, person: { select: { email: true, phoneNumber: true } }, metadata: true }
        })
      : [];
    if (customers.length !== resolvedCustomerIds.length) errors.push('Parte da audiência não foi encontrada no cadastro canônico.');
    const collisions = customers.filter(customer => campaign.excludeNurturing && customer.isInNurturing).length;
    if (collisions) warnings.push(`${collisions} contato(s) estão em nutrição e serão excluídos.`);
    const channels = new Set((campaign.flowVersion?.steps || []).map(step => step.channel).filter(Boolean));
    const missingEmail = channels.has('EMAIL')
      ? customers.filter(customer => !customer.person.email && !(customer.metadata as any)?.email).length
      : 0;
    const missingPhone = channels.has('WHATSAPP')
      ? customers.filter(customer => !customer.person.phoneNumber && !(customer.metadata as any)?.phoneNumber).length
      : 0;
    if (missingEmail) errors.push(`${missingEmail} contato(s) não possuem e-mail para o fluxo selecionado.`);
    if (missingPhone) errors.push(`${missingPhone} contato(s) não possuem telefone para o fluxo selecionado.`);
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        campaignId,
        name: campaign.name,
        status: campaign.status,
        nature: campaign.campaignNature,
        flow: campaign.flowVersion ? `v${campaign.flowVersion.version}` : null,
        pipeline: campaign.pipeline?.name || null,
        audience: customers.length,
        collisions,
        missingEmail,
        missingPhone,
        operators: campaign.operators.map(item => ({ id: item.user.id, name: item.user.name }))
      }
    };
  }

  static async enroll(campaignId: string, customerIds: Array<string | number>, options: { test?: boolean; sourceType?: string; sourceFormId?: string; fixedAssigneeId?: string } = {}) {
    const resolvedCustomerIds = await this.resolveAudience(customerIds);
    const preflight = await this.preflight(campaignId, resolvedCustomerIds);
    if (!preflight.valid) throw new Error(preflight.errors.join(' '));
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { operators: { include: { user: true } }, flowVersion: { include: { steps: { orderBy: { order: 'asc' } } } } }
    });
    if (!campaign) throw new Error('Campanha não encontrada.');
    const flowVersion = campaign.flowVersion;
    if (options.sourceType === 'FORM' && campaign.status !== 'ACTIVE') {
      throw new Error('O formulário está associado a uma campanha que não está ativa.');
    }
    const eligibleCustomers = await prisma.customer.findMany({
      where: { id: { in: resolvedCustomerIds }, ...(campaign.excludeNurturing ? { isInNurturing: false } : {}) },
      include: { person: true }
    });
    const activeOperators = campaign.operators.filter(item => item.user.isActive);
    const skilledOperators = campaign.strictSkillMatch && campaign.productId
      ? activeOperators.filter(item => Array.isArray(item.user.skills) && item.user.skills.includes(campaign.productId!))
      : activeOperators;
    if (campaign.strictSkillMatch && campaign.productId && skilledOperators.length === 0) {
      throw new Error('Nenhum operador selecionado possui a especialidade exigida pelo produto.');
    }
    const operatorIds = skilledOperators.map(item => item.userId);
    const scheduled: Array<{ enrollmentId: string; stepId: string; delay: number }> = [];
    const assignmentsPerOperator = new Map<string, number>();

    const result = await prisma.$transaction(async tx => {
      const enrollments = [];
      for (let index = 0; index < eligibleCustomers.length; index++) {
        const customer = eligibleCustomers[index];
        const existingEnrollment = await tx.campaignEnrollment.findUnique({
          where: { campaignId_customerId_isTest: { campaignId, customerId: customer.id, isTest: options.test === true } }
        });
        if (existingEnrollment && ['PENDING', 'RUNNING', 'PAUSED'].includes(existingEnrollment.status)) {
          enrollments.push(existingEnrollment);
          continue;
        }
        const accountManagerId = campaign.useAccountManager && customer.person.accountManagerActive && customer.person.accountManagerId && operatorIds.includes(customer.person.accountManagerId)
          ? customer.person.accountManagerId
          : undefined;
        const assigneeId = CampaignPolicyService.selectAssignee({
          routingMode: campaign.routingMode,
          operatorIds,
          index,
          fixedAssigneeId: options.fixedAssigneeId || accountManagerId
        });
        const assignmentKey = assigneeId || 'POOL';
        const assignmentIndex = assignmentsPerOperator.get(assignmentKey) || 0;
        assignmentsPerOperator.set(assignmentKey, assignmentIndex + 1);
        const startDayOffset = campaign.limitPerDay && campaign.limitPerDay > 0
          ? Math.floor(assignmentIndex / campaign.limitPerDay)
          : 0;
        const scheduledStart = new Date(Date.now() + startDayOffset * 24 * 60 * 60 * 1000);

        let opportunity = null;
        if (campaign.campaignNature === 'COMMERCIAL' && campaign.pipelineId) {
          opportunity = await tx.opportunity.findFirst({
            where: { customerId: customer.id, pipelineId: campaign.pipelineId, productId: campaign.productId, status: 'OPEN' }
          });
          if (!opportunity) {
            opportunity = await tx.opportunity.create({
              data: {
                customerId: customer.id,
                pipelineId: campaign.pipelineId,
                productId: campaign.productId,
                sourceCampaignId: campaign.id,
                assigneeId,
                stage: campaign.initialStage
              }
            });
          }
        }

        const enrollment = await tx.campaignEnrollment.upsert({
          where: { campaignId_customerId_isTest: { campaignId, customerId: customer.id, isTest: options.test === true } },
          create: {
            campaignId,
            customerId: customer.id,
            opportunityId: opportunity?.id || null,
            assigneeId,
            sourceType: options.test ? 'TEST' : (options.sourceType || 'SEGMENT'),
            sourceFormId: options.sourceFormId || null,
            status: startDayOffset > 0 ? 'PENDING' : 'RUNNING',
            isTest: options.test === true,
            startedAt: scheduledStart
          },
          update: { opportunityId: opportunity?.id || null, assigneeId, status: startDayOffset > 0 ? 'PENDING' : 'RUNNING', startedAt: scheduledStart, stopReason: null }
        });
        let executionId: string | null = null;
        if (flowVersion) {
          const execution = await tx.flowExecution.create({
            data: {
              flowId: flowVersion.flowId,
              flowVersionId: flowVersion.id,
              customerId: customer.id,
              opportunityId: opportunity?.id || null,
              status: 'RUNNING'
            }
          });
          executionId = execution.id;
          await tx.campaignEnrollment.update({ where: { id: enrollment.id }, data: { flowExecutionId: execution.id } });
          const firstStep = flowVersion.steps[0];
          if (firstStep) {
            scheduled.push({ enrollmentId: enrollment.id, stepId: firstStep.id, delay: Math.max(0, startDayOffset * 24 * 60 * 60 * 1000 + (firstStep.delayMinutes || 0) * 60_000) });
          }
        }
        enrollments.push({ ...enrollment, flowExecutionId: executionId });
      }
      await tx.campaign.update({ where: { id: campaignId }, data: { status: options.test ? 'TESTING' : 'ACTIVE' } });
      return enrollments;
    });

    if (scheduled.length) {
      try {
        const { automationQueue } = await import('@/lib/queue/automationQueue');
        for (const job of scheduled) {
          await automationQueue.add('campaign-flow-step', job, { delay: job.delay });
        }
      } catch (error: any) {
        await prisma.$transaction([
          prisma.campaign.update({ where: { id: campaignId }, data: { status: 'PAUSED' } }),
          prisma.campaignEnrollment.updateMany({
            where: { id: { in: result.map(item => item.id) } },
            data: { status: 'FAILED', stopReason: `QUEUE_ERROR: ${error.message || 'indisponível'}` }
          })
        ]);
        throw new Error('A campanha foi pausada porque a fila de automação está indisponível. Nenhum disparo foi liberado.');
      }
    }
    return result;
  }
}
