import { Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';
import prisma from '../prisma';
import { redisConnection } from './connection';
import { mailQueue } from './mailQueue';
import { decrypt } from '../crypto';
import { compileTemplate } from '../services/providers/MailerProvider';

const worker = new Worker(
  'mail-queue',
  async (job: Job) => {
    // 1. VERIFICAÇÃO DE JOBS DO FLUXO DE ENCADEAMENTO (start-campaign)
    if (job.name === 'start-campaign') {
      const { campaignId } = job.data;
      console.log(`[MailWorker] 🔗 Fluxo Ativado: Iniciando campanha/jornada ${campaignId}`);

      const journey = await prisma.journey.findUnique({
        where: { id: campaignId },
      });

      if (!journey) {
        console.error(`[MailWorker] Campanha/Jornada ${campaignId} não encontrada.`);
        return;
      }

      // Altera o status da jornada para PROCESSING
      await prisma.journey.update({
        where: { id: campaignId },
        data: { status: 'PROCESSING' },
      });

      // Busca todos os destinatários ainda pendentes
      const createdLogs = await prisma.recipientLog.findMany({
        where: { journeyId: campaignId, status: 'PENDING' },
        select: { id: true },
      });

      if (createdLogs.length === 0) {
        console.log(`[MailWorker] Nenhum destinatário pendente para a campanha ${campaignId}.`);
        await prisma.journey.update({
          where: { id: campaignId },
          data: { status: 'COMPLETED' },
        });
        return;
      }

      // Adiciona em lote na fila do BullMQ
      const jobs = createdLogs.map((log) => ({
        name: `mail-${log.id}`,
        data: {
          recipientLogId: log.id,
          journeyId: journey.id,
        },
      }));

      await mailQueue.addBulk(jobs);
      console.log(`[MailWorker] 🚀 ${jobs.length} e-mails adicionados à fila para a campanha ${journey.name}`);
      return;
    }

    // 2. DISPAROS DE E-MAILS PADRÃO
    const { recipientLogId, journeyId } = job.data;

    // Verifica status atual da campanha/jornada no banco de dados
    const journey = await prisma.journey.findUnique({
      where: { id: journeyId },
      include: { template: true, smtpConfig: true },
    });

    if (!journey) {
      throw new Error(`Campanha/Jornada ${journeyId} não encontrada.`);
    }

    // Se estiver cancelada, descarta o disparo
    if (journey.status === 'CANCELLED') {
      await prisma.recipientLog.update({
        where: { id: recipientLogId },
        data: {
          status: 'FAILED',
          error: 'Disparo abortado devido ao cancelamento da campanha.',
        },
      });
      return;
    }

    // Se estiver pausada, lança um erro para re-enfileirar o job
    if (journey.status === 'PAUSED') {
      throw new Error('A campanha está pausada. Retentando em instantes...');
    }

    const recipient = await prisma.recipientLog.findUnique({
      where: { id: recipientLogId },
    });

    if (!recipient) {
      throw new Error(`Destinatário ${recipientLogId} não encontrado.`);
    }

    // Se já foi enviado por algum motivo, pula
    if (recipient.status === 'SENT') {
      return;
    }

    if (!journey.smtpConfig) {
      const errorMsg = 'Configuração SMTP ausente na campanha.';
      await prisma.recipientLog.update({
        where: { id: recipientLogId },
        data: { status: 'FAILED', error: errorMsg },
      });
      await prisma.journey.update({
        where: { id: journeyId },
        data: { failedEmails: { increment: 1 } },
      });
      return;
    }

    if (!journey.template) {
      const errorMsg = 'Template de e-mail ausente na campanha.';
      await prisma.recipientLog.update({
        where: { id: recipientLogId },
        data: { status: 'FAILED', error: errorMsg },
      });
      await prisma.journey.update({
        where: { id: journeyId },
        data: { failedEmails: { increment: 1 } },
      });
      return;
    }

    // Descriptografa a senha do SMTP
    let decryptedPassword = '';
    try {
      decryptedPassword = decrypt(journey.smtpConfig.pass);
    } catch (err: any) {
      const errorMsg = 'Falha ao descriptografar a senha do SMTP.';
      await prisma.recipientLog.update({
        where: { id: recipientLogId },
        data: { status: 'FAILED', error: errorMsg },
      });
      await prisma.journey.update({
        where: { id: journeyId },
        data: { failedEmails: { increment: 1 } },
      });
      return;
    }

    // Prepara variáveis para compilação
    const recipientData = (recipient.data as Record<string, any>) || {};
    
    // Provedor de variáveis padrão com base na linha do Excel
    const variables = {
      ...recipientData,
      customer: {
        fullName: recipientData.fullName || recipientData.nome || '',
        name: recipientData.name || recipientData.nome || '',
        email: recipient.email,
        phone: recipientData.phoneNumber || recipientData.phone || recipientData.telefone || '',
        city: recipientData.city || recipientData.cidade || '',
        specialty: recipientData.specialty || recipientData.especialidade || '',
        plan: recipientData.plan || recipientData.plano || '',
        expiration: recipientData.expirationDate || recipientData.expiracao || '',
      },
      campaign: {
        name: journey.name,
      },
      company: {
        name: 'DentalGO',
      }
    };

    const compiledSubject = compileTemplate(journey.template.subject || 'Notificação', variables);
    
    // Injeta pixel invisível de rastreamento de abertura
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const trackingPixel = `<img src="${appUrl}/api/track/open/${recipientLogId}" width="1" height="1" style="display:none !important;" alt="" />`;
    const compiledBody = compileTemplate(journey.template.content, variables) + trackingPixel;

    // Configura o transportador nodemailer
    const transporter = nodemailer.createTransport({
      host: journey.smtpConfig.host,
      port: journey.smtpConfig.port,
      secure: journey.smtpConfig.secure,
      auth: {
        user: journey.smtpConfig.user,
        pass: decryptedPassword,
      },
    });

    try {
      // Envia o e-mail
      await transporter.sendMail({
        from: `"${journey.smtpConfig.name}" <${journey.smtpConfig.user}>`,
        to: recipient.email,
        subject: compiledSubject,
        html: compiledBody,
      });

      // Sucesso: Atualiza DB
      await prisma.recipientLog.update({
        where: { id: recipientLogId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          error: null,
        },
      });

      await prisma.journey.update({
        where: { id: journeyId },
        data: { sentEmails: { increment: 1 } },
      });

      // Criar registro de Interaction para histórico permanente
      // Busca o customer correspondente se houver na base pelo email
      const customer = await prisma.customer.findFirst({
        where: { 
          OR: [
            { metadata: { path: ['email'], equals: recipient.email } },
            { metadata: { path: ['emailKey'], equals: recipient.email } },
          ],
          journeyId
        }
      });
      
      if (customer) {
        await prisma.interaction.create({
          data: {
            customerId: customer.id,
            text: `E-mail enviado da campanha "${journey.name}": "${compiledSubject}"`,
            authorId: 'system',
            type: 'EMAIL_SENT',
            metadata: {
              journeyId,
              recipientLogId,
              templateId: journey.templateId,
              smtpConfigId: journey.smtpConfigId,
            }
          }
        });
      }

    } catch (sendError: any) {
      console.error(`[MailWorker] Erro ao enviar e-mail para ${recipient.email}:`, sendError);
      
      // Falha: Atualiza DB
      await prisma.recipientLog.update({
        where: { id: recipientLogId },
        data: {
          status: 'FAILED',
          error: sendError.message || 'Erro desconhecido no envio SMTP.',
        },
      });

      await prisma.journey.update({
        where: { id: journeyId },
        data: { failedEmails: { increment: 1 } },
      });
    }

    // Verifica se a campanha foi finalizada
    const updatedJourney = await prisma.journey.findUnique({
      where: { id: journeyId },
    });

    if (updatedJourney) {
      const processed = updatedJourney.sentEmails + updatedJourney.failedEmails;
      if (processed >= updatedJourney.totalEmails && updatedJourney.status === 'PROCESSING') {
        // Campanha marcada como COMPLETED
        await prisma.journey.update({
          where: { id: journeyId },
          data: { status: 'COMPLETED' },
        });

        // 🔗 ENCADEAMENTO DE CAMPANHAS: Agendar a próxima se houver configurada
        if (updatedJourney.nextCampaignId) {
          const delayMs = updatedJourney.nextCampaignDelayMinutes * 60 * 1000;
          console.log(`[MailWorker] 🔗 Campanha ${updatedJourney.name} concluída. Agendando próxima campanha (ID: ${updatedJourney.nextCampaignId}) para daqui a ${updatedJourney.nextCampaignDelayMinutes} minutos.`);
          
          await mailQueue.add(
            'start-campaign',
            { campaignId: updatedJourney.nextCampaignId },
            { delay: delayMs }
          );
        }
      }
    }

    // 🕒 CONTROLE DE CADÊNCIA (Calcula o delay dinâmico antes de finalizar o Job)
    let delay = 50; // Modo IMMEDIATE (padrão imediato)
    
    if (journey.sendingMode === 'FIXED') {
      delay = journey.minDelay;
    } else if (journey.sendingMode === 'RANDOM') {
      const min = journey.minDelay;
      const max = journey.maxDelay;
      // Calcula número aleatório entre min e max inclusivo
      delay = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  },
  {
    connection: redisConnection as any,
    concurrency: 1, // Processamento sequencial obrigatório para cadência correta
  }
);

worker.on('ready', () => {
  console.log('🚀 Worker BullMQ pronto e escutando a fila "mail-queue".');
});

worker.on('active', (job) => {
  console.log(`[MailWorker] 📥 Processando job [${job.name}] (ID: ${job.id})`);
});

worker.on('completed', (job) => {
  console.log(`[MailWorker] ✅ Job [${job.name}] concluído.`);
});

worker.on('failed', (job, err) => {
  console.error(`[MailWorker] ❌ Job [${job?.name}] falhou:`, err.message);
});

export default worker;
