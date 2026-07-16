import { NotificationProvider } from './NotificationProvider';
import { compileTemplate } from './MailerProvider';

export class ZapiProvider implements NotificationProvider {
  private formatPhone(phone: string): string {
    let formatted = phone.replace(/\D/g, '');
    if (formatted.length > 0 && !formatted.startsWith('55')) {
      formatted = '55' + formatted;
    }
    return formatted;
  }

  async sendMessage(to: string, text: string, config: any): Promise<boolean> {
    const url = config?.url || process.env.ZAPI_API_URL;
    const token = config?.token || process.env.ZAPI_API_TOKEN;
    const instance = config?.instance || process.env.ZAPI_API_INSTANCE;

    const formattedNumber = this.formatPhone(to);
    console.log(`[ZapiProvider] Preparando WhatsApp para: ${formattedNumber}`);

    if (!url || !token || !instance) {
      console.warn('[ZapiProvider] Z-API não configurada nas variáveis de ambiente. Gravando mock success.');
      return true; // Mock success
    }

    try {
      const endpoint = `${url}/instancia/${instance}/token/${token}/send-messages`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formattedNumber,
          message: text,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[ZapiProvider] Erro ao enviar. Status: ${res.status}. Detalhes:`, errText);
        return false;
      }

      console.log(`[ZapiProvider] WhatsApp enviado com sucesso via Z-API para ${formattedNumber}`);
      return true;
    } catch (err) {
      console.error('[ZapiProvider] Erro na requisição:', err);
      return false;
    }
  }

  async sendTemplate(
    to: string,
    template: { subject?: string; content: string },
    variables: Record<string, any>,
    config: any
  ): Promise<boolean> {
    const compiledText = compileTemplate(template.content, variables);
    return this.sendMessage(to, compiledText, config);
  }

  async validateConnection(config: any): Promise<{ success: boolean; message?: string }> {
    return { success: true, message: 'Z-API mock connection validation success!' };
  }

  async healthCheck(config: any): Promise<boolean> {
    return true;
  }

  async parseWebhook(body: any): Promise<any> {
    return body;
  }
}
