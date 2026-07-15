import { NotificationProvider } from './NotificationProvider';
import { compileTemplate } from './MailerProvider';

export class EvolutionProvider implements NotificationProvider {
  private formatPhone(phone: string): string {
    let formatted = phone.replace(/\D/g, '');
    if (formatted.length > 0 && !formatted.startsWith('55')) {
      formatted = '55' + formatted;
    }
    return formatted;
  }

  async sendMessage(to: string, text: string, config: any): Promise<boolean> {
    const url = config?.url || process.env.EVOLUTION_API_URL;
    const key = config?.apiKey || process.env.EVOLUTION_API_KEY;
    const instance = config?.instance || process.env.EVOLUTION_API_INSTANCE;

    const formattedNumber = this.formatPhone(to);
    console.log(`[EvolutionProvider] Preparando WhatsApp para: ${formattedNumber}`);

    if (!url || !key || !instance) {
      console.warn('[EvolutionProvider] Evolution API não configurada. Ignorando envio real e gravando mock success.');
      return true; // Mock success
    }

    try {
      const endpoint = `${url}/message/sendText/${instance}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
        },
        body: JSON.stringify({
          number: formattedNumber,
          text,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[EvolutionProvider] Erro ao enviar WhatsApp. Status: ${res.status}. Detalhes:`, errText);
        return false;
      }

      console.log(`[EvolutionProvider] WhatsApp enviado com sucesso para ${formattedNumber}`);
      return true;
    } catch (err) {
      console.error('[EvolutionProvider] Erro na requisição do WhatsApp:', err);
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
    const url = config?.url || process.env.EVOLUTION_API_URL;
    const key = config?.apiKey || process.env.EVOLUTION_API_KEY;
    const instance = config?.instance || process.env.EVOLUTION_API_INSTANCE;

    if (!url || !key || !instance) {
      return { success: false, message: 'Parâmetros de conexão Evolution API incompletos.' };
    }

    try {
      const endpoint = `${url}/instance/connectionState/${instance}`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          apikey: key,
        },
      });

      if (!res.ok) {
        return { success: false, message: `Servidor retornou status ${res.status}` };
      }

      const data = await res.json();
      if (data?.instance?.state === 'open' || data?.instance?.connection === 'CONNECTED') {
        return { success: true, message: 'Evolution API conectada com sucesso!' };
      }

      return { 
        success: false, 
        message: `Instância não está conectada. Estado atual: ${data?.instance?.state || 'desconhecido'}` 
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Falha ao conectar na Evolution API' };
    }
  }

  async healthCheck(config: any): Promise<boolean> {
    const result = await this.validateConnection(config);
    return result.success;
  }

  async parseWebhook(body: any): Promise<any> {
    // Parser for message delivery/read events from Evolution API
    return body;
  }
}
