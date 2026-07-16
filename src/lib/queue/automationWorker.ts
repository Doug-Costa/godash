import { Worker, Job } from 'bullmq';
import prisma from '../prisma';
import pool from '../db';
import { redisConnection } from './connection';
import { NotificationService } from '../services/NotificationService';
import { compileTemplate } from '../services/providers/MailerProvider';

export const automationWorker = new Worker(
  'automation-queue',
  async (job: Job) => {
    const { customerId, automationId, journeyId, warmupTemplateId } = job.data;
    console.log(`[AutomationWorker] 📥 Processing job ${job.id} for customer ${customerId}`);

    // 1. Fetch current Customer state
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      console.log(`[AutomationWorker] Customer ${customerId} no longer exists. Skipping.`);
      return;
    }

    // Guard: If customer has transitioned to another journey, skip this job!
    if (customer.journeyId !== journeyId) {
      console.log(`[AutomationWorker] Customer ${customerId} journey has changed (Current: ${customer.journeyId}, Job: ${journeyId}). Skipping automation.`);
      return;
    }

    let templateSubject = 'Notificação';
    let templateContent = '';
    let targetChannel = 'WHATSAPP';
    let providerName = 'EVOLUTION';
    let smtpConfig: any = null;
    let campaignName = '';

    if (!automationId && warmupTemplateId) {
      // 2a. Warmup Template case
      const template = await prisma.template.findUnique({
        where: { id: warmupTemplateId }
      });
      if (!template) {
        console.warn(`[AutomationWorker] Warmup template ${warmupTemplateId} not found. FAILED.`);
        return;
      }
      templateSubject = template.subject || 'Notificação';
      templateContent = template.content;
      targetChannel = (template.type || 'WHATSAPP').toUpperCase();

      const journey = await prisma.journey.findUnique({
        where: { id: journeyId },
        include: { smtpConfig: true }
      });
      campaignName = journey?.name || '';
      smtpConfig = journey?.smtpConfig || null;
    } else {
      // 2b. Regular step automation case
      const automation = await prisma.automation.findUnique({
        where: { id: automationId },
        include: { template: true, journey: { include: { smtpConfig: true } } }
      });

      if (!automation || !automation.isActive) {
        console.log(`[AutomationWorker] Automation step ${automationId} is invalid or inactive. Skipping.`);
        return;
      }

      templateSubject = automation.template?.subject || 'Notificação';
      templateContent = automation.template?.content || (automation.actionConfig as any)?.messageTemplate || '';
      targetChannel = (automation.channel || 'WHATSAPP').toUpperCase();
      providerName = automation.provider || 'EVOLUTION';
      smtpConfig = automation.journey?.smtpConfig || null;
      campaignName = automation.journey?.name || '';
    }

    // 3. Fetch recipient data from MySQL database
    let person: any = null;
    try {
      const [rows] = await pool.query(
        'SELECT id, fullName, email, phoneNumber, city FROM people WHERE id = ? LIMIT 1',
        [customer.externalPersonId]
      );
      person = (rows as any[])[0];
    } catch (dbErr) {
      console.warn('[AutomationWorker] Could not query person details from MySQL:', dbErr);
    }

    const customerMeta = (customer.metadata as Record<string, any>) || {};
    const recipientEmail = person?.email || customerMeta.email || '';
    const recipientPhone = person?.phoneNumber || customerMeta.phoneNumber || '';

    // Check availability of target channels
    if (targetChannel === 'EMAIL' && !recipientEmail) {
      console.warn(`[AutomationWorker] E-mail channel selected but customer has no email address. FAILED.`);
      await recordFailure(customerId, 'Cliente não possui endereço de e-mail cadastrado.', 'EMAIL');
      return;
    }
    if (targetChannel === 'WHATSAPP' && !recipientPhone) {
      console.warn(`[AutomationWorker] WhatsApp channel selected but customer has no phone number. FAILED.`);
      await recordFailure(customerId, 'Cliente não possui número de telefone cadastrado.', 'WHATSAPP');
      return;
    }

    if (!templateContent) {
      console.warn(`[AutomationWorker] No message content or template found. FAILED.`);
      await recordFailure(customerId, 'Conteúdo do template de automação vazio.', targetChannel);
      return;
    }

    const variables = {
      ...customerMeta,
      customer: {
        fullName: person?.fullName || customerMeta.fullName || 'Doutor(a)',
        name: person?.fullName || customerMeta.fullName || 'Doutor(a)',
        email: recipientEmail,
        phone: recipientPhone,
        city: person?.city || customerMeta.city || '',
        plan: customerMeta.planTitle || customerMeta.plan || '',
        expiration: customerMeta.expirationDate || '',
      },
      campaign: {
        name: campaignName || '',
      },
      company: {
        name: 'DentalGO',
      }
    };

    const compiledSubject = compileTemplate(templateSubject, variables);
    const compiledContent = compileTemplate(templateContent, variables);

    // 5. Execute notification sending
    let success = false;
    let errorMessage: string | null = null;

    try {
      if (targetChannel === 'EMAIL') {
        const mailConfig = smtpConfig || undefined;
        success = await NotificationService.sendTemplate(
          recipientEmail,
          'EMAIL',
          { subject: compiledSubject, content: compiledContent },
          variables,
          mailConfig
        );
      } else if (targetChannel === 'WHATSAPP') {
        success = await NotificationService.sendTemplate(
          recipientPhone,
          'WHATSAPP',
          { content: compiledContent },
          variables,
          {
            provider: providerName || 'EVOLUTION',
            url: process.env.EVOLUTION_API_URL,
            apiKey: process.env.EVOLUTION_API_KEY,
            instance: process.env.EVOLUTION_API_INSTANCE,
          }
        );
      }
    } catch (sendErr: any) {
      errorMessage = sendErr.message || 'Erro de envio desconhecido.';
      console.error(`[AutomationWorker] Exception during send operation:`, sendErr);
    }

    // 6. Record interaction logs with deliveryStatus
    await prisma.interaction.create({
      data: {
        customerId,
        text: targetChannel === 'EMAIL' 
          ? `[E-mail Automático] ${compiledSubject}:\n"${compiledContent}"`
          : `[WhatsApp Automático]:\n"${compiledContent}"`,
        authorId: null,
        type: 'SYSTEM_AUTOMATION',
        channel: targetChannel,
        deliveryStatus: success ? 'SENT' : 'FAILED',
        errorMessage: success ? null : (errorMessage || 'Falha no conector de envio.'),
      }
    });

    console.log(`[AutomationWorker] Job processed for Customer ${customerId} (Success: ${success})`);
  },
  {
    connection: redisConnection as any,
  }
);

// Helper function to record failures in Interaction logs
async function recordFailure(customerId: string, reason: string, channel: string) {
  await prisma.interaction.create({
    data: {
      customerId,
      text: `Falha na automação automática via ${channel}: ${reason}`,
      authorId: null,
      type: 'SYSTEM_AUTOMATION',
      channel,
      deliveryStatus: 'FAILED',
      errorMessage: reason
    }
  });
}

automationWorker.on('completed', (job) => {
  console.log(`[AutomationWorker] Job [${job.name}] (ID: ${job.id}) completed successfully.`);
});

automationWorker.on('failed', (job, err) => {
  console.error(`[AutomationWorker] Job [${job?.name}] (ID: ${job?.id}) failed:`, err.message);
});

export default automationWorker;
