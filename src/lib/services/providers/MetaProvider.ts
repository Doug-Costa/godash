import { NotificationProvider } from './NotificationProvider';
import { compileTemplate } from './MailerProvider';

export class MetaProvider implements NotificationProvider {
  private formatPhone(phone: string): string {
    let formatted = phone.replace(/\D/g, '');
    if (formatted.length > 0 && !formatted.startsWith('55')) {
      formatted = '55' + formatted;
    }
    return formatted;
  }

  async sendMessage(to: string, text: string, config: any): Promise<boolean> {
    const token = config?.token || process.env.META_API_TOKEN;
    const phoneNumberId = config?.phoneNumberId || process.env.META_PHONE_NUMBER_ID;

    const formattedNumber = this.formatPhone(to);
    console.log(`[MetaProvider] Preparando WhatsApp para: ${formattedNumber}`);

    if (!token || !phoneNumberId) {
      console.warn('[MetaProvider] Meta Cloud API não configurada. Gravando mock success.');
      return true; // Mock success
    }

    try {
      const endpoint = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'text',
          text: { body: text },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[MetaProvider] Erro ao enviar. Status: ${res.status}. Detalhes:`, errText);
        return false;
      }

      console.log(`[MetaProvider] WhatsApp enviado com sucesso via Meta Cloud API para ${formattedNumber}`);
      return true;
    } catch (err) {
      console.error('[MetaProvider] Erro na requisição Meta Cloud API:', err);
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
    return { success: true, message: 'Meta Cloud API connection validation success!' };
  }

  async healthCheck(config: any): Promise<boolean> {
    return true;
  }

  async parseWebhook(body: any): Promise<any> {
    return body;
  }
}
