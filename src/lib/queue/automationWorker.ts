import { Worker, Job } from 'bullmq';
import prisma from '../prisma';
import pool from '../db';
import { redisConnection } from './connection';
import { NotificationService } from '../services/NotificationService';
import { compileTemplate } from '../services/providers/MailerProvider';

export const automationWorker = new Worker(
  'automation-queue',
  async (job: Job) => {
    const { customerId, automationId, journeyId } = job.data;
    console.log(`[AutomationWorker] 📥 Processing automation job ${automationId} for customer ${customerId}`);

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

    // 2. Fetch Automation & Template details
    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
      include: { template: true, journey: { include: { smtpConfig: true } } }
    });

    if (!automation || !automation.isActive) {
      console.log(`[AutomationWorker] Automation step ${automationId} is invalid or inactive. Skipping.`);
      return;
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
    const targetChannel = (automation.channel || 'WHATSAPP').toUpperCase();
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

    // 4. Resolve Template layout & variables
    const templateSubject = automation.template?.subject || 'Notificação';
    const templateContent = automation.template?.content || (automation.actionConfig as any)?.messageTemplate || '';

    if (!templateContent) {
      console.warn(`[AutomationWorker] No message content or template found for automation ${automationId}. FAILED.`);
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
        name: automation.journey?.name || '',
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
        const mailConfig = automation.journey?.smtpConfig || undefined;
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
            provider: automation.provider || 'EVOLUTION',
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
