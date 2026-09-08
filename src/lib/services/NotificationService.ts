import { MailerProvider } from './providers/MailerProvider';
import { EvolutionProvider } from './providers/EvolutionProvider';
import { ZapiProvider } from './providers/ZapiProvider';
import { MetaProvider } from './providers/MetaProvider';
import { NotificationProvider } from './providers/NotificationProvider';
import prisma from '../prisma';

export class NotificationService {
  private static mailerProvider = new MailerProvider();
  private static evolutionProvider = new EvolutionProvider();
  private static zapiProvider = new ZapiProvider();
  private static metaProvider = new MetaProvider();

  /**
   * Resolve o NotificationProvider adequado para o canal e provedor escolhidos
   */
  static resolveProvider(channel: string, providerName?: string | null): NotificationProvider {
    const ch = channel.toUpperCase();
    const prov = providerName?.toUpperCase();

    if (ch === 'EMAIL') {
      return this.mailerProvider;
    }

    if (ch === 'WHATSAPP') {
      if (prov === 'ZAPI') {
        return this.zapiProvider;
      }
      if (prov === 'META') {
        return this.metaProvider;
      }
      return this.evolutionProvider;
    }

    throw new Error(`Canal de notificação ou provedor não suportado: ${channel} / ${providerName}`);
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
   * Resolve a configuração SMTP a ser utilizada (do banco ou fallback env)
   */
  static async resolveEmailConfig(config?: any): Promise<any> {
    const customConfig = config ? { ...config } : {};

    // Se já tiver credenciais completas, apenas retornar
    if (customConfig.host && customConfig.port && customConfig.user && customConfig.pass) {
      return customConfig;
    }

    try {
      let smtp = null;
      if (customConfig.smtpConfigId) {
        smtp = await prisma.smtpConfig.findUnique({
          where: { id: customConfig.smtpConfigId }
        });
      }
      if (!smtp) {
        smtp = await prisma.smtpConfig.findFirst({
          where: { active: true }
        });
      }

      if (smtp) {
        return {
          ...customConfig,
          host: smtp.host,
          port: smtp.port,
          user: smtp.user,
          pass: smtp.pass,
          secure: smtp.secure,
          name: smtp.name,
          fromEmail: (smtp as any).fromEmail || smtp.user
        };
      }
    } catch (err) {
      console.warn('[NotificationService] Falha ao carregar SMTP ativo do banco:', err);
    }

    // Fallback legado via env
    return {
      ...customConfig,
      host: process.env.SMTP_HOST || process.env.SMTP_SERVICE_URL || '',
      port: Number(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      secure: process.env.SMTP_SECURE === 'true',
      name: customConfig.name || 'DentalGO',
      fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || ''
    };
  }

  /**
   * Envia e-mail via SMTP ativo no banco ou fallback para SMTP de ambiente
   * Mantém compatibilidade com chamadas legadas
   */
  static async sendEmail(to: string, subject: string, body: string, config?: any): Promise<boolean> {
    const effectiveConfig = await this.resolveEmailConfig(config);
    return this.mailerProvider.sendTemplate(to, { subject, content: body }, {}, effectiveConfig);
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
    const ch = channel.toUpperCase();
    const providerName = config?.provider || (ch === 'EMAIL' ? 'MAILER' : null);
    const provider = this.resolveProvider(ch, providerName);

    let effectiveConfig = config;
    if (ch === 'EMAIL') {
      effectiveConfig = await this.resolveEmailConfig(config);
    }

    return provider.sendTemplate(to, template, variables, effectiveConfig);
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
    const ch = channel.toUpperCase();
    const providerName = config?.provider || (ch === 'EMAIL' ? 'MAILER' : null);
    const provider = this.resolveProvider(ch, providerName);

    let effectiveConfig = config;
    if (ch === 'EMAIL') {
      effectiveConfig = await this.resolveEmailConfig(config);
    }

    return provider.sendMessage(to, text, effectiveConfig);
  }
}

