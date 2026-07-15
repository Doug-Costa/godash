import { MailerProvider } from './providers/MailerProvider';
import { EvolutionProvider } from './providers/EvolutionProvider';
import { NotificationProvider } from './providers/NotificationProvider';
import prisma from '../prisma';

export class NotificationService {
  private static mailerProvider = new MailerProvider();
  private static evolutionProvider = new EvolutionProvider();

  /**
   * Resolve o NotificationProvider adequado para o canal escolhido
   */
  static resolveProvider(channel: string): NotificationProvider {
    const ch = channel.toUpperCase();
    if (ch === 'EMAIL') {
      return this.mailerProvider;
    }
    if (ch === 'WHATSAPP') {
      return this.evolutionProvider;
    }
    throw new Error(`Canal de notificação não suportado: ${channel}`);
  }

  /**
   * Envia mensagem de texto via WhatsApp (Evolution API)
   * Mantém compatibilidade com chamadas legadas
   */
  static async sendWhatsApp(number: string, text: string): Promise<boolean> {
    return this.evolutionProvider.sendMessage(number, text, {
      url: process.env.EVOLUTION_API_URL,
      apiKey: process.env.EVOLUTION_API_KEY,
      instance: process.env.EVOLUTION_API_INSTANCE,
    });
  }

  /**
   * Envia e-mail via SMTP ativo no banco ou fallback para SMTP de ambiente
   * Mantém compatibilidade com chamadas legadas
   */
  static async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      // 1. Tentar buscar SMTP ativo do banco de dados PostgreSQL
      const activeSmtp = await prisma.smtpConfig.findFirst({
        where: { active: true },
      });

      if (activeSmtp) {
        console.log(`[NotificationService] Enviando e-mail usando SMTP ativo do banco: "${activeSmtp.name}"`);
        return this.mailerProvider.sendTemplate(to, { subject, content: body }, {}, activeSmtp);
      }
    } catch (dbError) {
      console.warn('[NotificationService] Falha ao ler SMTP ativo do banco, tentando via env:', dbError);
    }

    // 2. Fallback: Envio legado via HTTP POST se SMTP_SERVICE_URL for URL
    const smtpUrl = process.env.SMTP_SERVICE_URL;
    if (smtpUrl && (smtpUrl.startsWith('http://') || smtpUrl.startsWith('https://'))) {
      console.log(`[NotificationService] Enviando e-mail legado via HTTP POST para: ${to}`);
      try {
        const res = await fetch(smtpUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to,
            subject,
            body,
          }),
        });
        return res.ok;
      } catch (err) {
        console.error('[NotificationService] Erro no envio HTTP SMTP legado:', err);
        return false;
      }
    }

    // 3. Fallback final: Envio via MailerProvider usando as variáveis de ambiente locais do SMTP
    return this.mailerProvider.sendTemplate(to, { subject, content: body }, {}, {
      host: process.env.SMTP_HOST || smtpUrl || '',
      port: Number(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      secure: process.env.SMTP_SECURE === 'true',
    });
  }

  /**
   * Envia uma notificação usando templates e variáveis dinâmicas
   */
  static async sendTemplate(
    to: string,
    channel: string,
    template: { subject?: string; content: string },
    variables: Record<string, any>,
    config?: any
  ): Promise<boolean> {
    const provider = this.resolveProvider(channel);
    return provider.sendTemplate(to, template, variables, config);
  }

  /**
   * Envia uma mensagem direta por canal
   */
  static async sendMessage(
    to: string,
    channel: string,
    text: string,
    config?: any
  ): Promise<boolean> {
    const provider = this.resolveProvider(channel);
    return provider.sendMessage(to, text, config);
  }
}
