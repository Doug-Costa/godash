import nodemailer from 'nodemailer';
import { NotificationProvider } from './NotificationProvider';
import { decrypt } from '@/lib/crypto';

export function compileTemplate(text: string, data: Record<string, any>): string {
  if (!text) return '';
  return text.replace(/\{\{\s*(.*?)\s*\}\}/g, (match, key) => {
    // Direct match
    if (data[key] !== undefined) return String(data[key]);

    // Case-insensitive match
    const foundKey = Object.keys(data).find(k => k.toLowerCase() === key.toLowerCase());
    if (foundKey !== undefined && data[foundKey] !== undefined) {
      return String(data[foundKey]);
    }

    // Nested match (e.g. customer.fullName)
    const parts = key.split('.');
    let currentVal: any = data;
    for (const part of parts) {
      if (currentVal && typeof currentVal === 'object') {
        const matchingKey = Object.keys(currentVal).find(k => k.toLowerCase() === part.toLowerCase());
        currentVal = matchingKey !== undefined ? currentVal[matchingKey] : undefined;
      } else {
        currentVal = undefined;
        break;
      }
    }
    if (currentVal !== undefined && currentVal !== null) {
      return String(currentVal);
    }

    return match;
  });
}

export class MailerProvider implements NotificationProvider {
  async sendMessage(to: string, text: string, config: any): Promise<boolean> {
    return this.sendTemplate(to, { subject: 'Notificação do Sistema', content: text }, {}, config);
  }

  async sendTemplate(
    to: string,
    template: { subject?: string; content: string },
    variables: Record<string, any>,
    config: any
  ): Promise<boolean> {
    try {
      if (!config || !config.host || !config.port || !config.user || !config.pass) {
        throw new Error('Configuração SMTP incompleta.');
      }

      // Decrypt password
      let decryptedPassword = '';
      try {
        decryptedPassword = decrypt(config.pass);
      } catch (err) {
        // Fallback if not encrypted (for testing or raw input validation)
        decryptedPassword = config.pass;
      }

      const compiledSubject = compileTemplate(template.subject || 'Notificação', variables);
      const compiledBody = compileTemplate(template.content, variables);

      const transporter = nodemailer.createTransport({
        host: config.host,
        port: Number(config.port),
        secure: config.secure === true || config.secure === 'true',
        auth: {
          user: config.user,
          pass: decryptedPassword,
        },
      });

      const info = await transporter.sendMail({
        from: `"${config.name || 'DentalGO'}" <${config.user}>`,
        to,
        subject: compiledSubject,
        html: compiledBody,
      });

      console.log(`[MailerProvider] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`[MailerProvider] Error sending email to ${to}:`, error);
      return false;
    }
  }

  async validateConnection(config: any): Promise<{ success: boolean; message?: string }> {
    try {
      if (!config || !config.host || !config.port || !config.user || !config.pass) {
        return { success: false, message: 'Configurações SMTP obrigatórias ausentes.' };
      }

      let passwordToTest = config.pass;
      try {
        passwordToTest = decrypt(config.pass);
      } catch (err) {
        // Fallback if password is raw
        passwordToTest = config.pass;
      }

      const transporter = nodemailer.createTransport({
        host: config.host,
        port: Number(config.port),
        secure: config.secure === true || config.secure === 'true',
        auth: {
          user: config.user,
          pass: passwordToTest,
        },
      });

      await transporter.verify();
      return { success: true, message: 'Conexão SMTP estabelecida e validada com sucesso!' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Falha ao autenticar no servidor SMTP.' };
    }
  }

  async healthCheck(config: any): Promise<boolean> {
    const result = await this.validateConnection(config);
    return result.success;
  }

  async parseWebhook(body: any): Promise<any> {
    // SMTP bounce/delivery webhooks can be processed here if needed
    return body;
  }
}
