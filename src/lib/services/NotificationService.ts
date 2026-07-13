export class NotificationService {
  /**
   * Envia mensagem de texto via WhatsApp (Evolution API)
   */
  static async sendWhatsApp(number: string, text: string): Promise<boolean> {
    const url = process.env.EVOLUTION_API_URL;
    const key = process.env.EVOLUTION_API_KEY;
    const instance = process.env.EVOLUTION_API_INSTANCE;

    // Formata o número (garantindo DDI e DDD)
    let formattedNumber = number.replace(/\D/g, '');
    if (formattedNumber.length > 0 && !formattedNumber.startsWith('55')) {
      formattedNumber = '55' + formattedNumber;
    }

    console.log(`[NotificationService] Preparando envio de WhatsApp para: ${formattedNumber}`);

    if (!url || !key || !instance) {
      console.warn('[NotificationService] Evolution API não configurada no .env. Ignorando envio real e logando no console:', {
        number: formattedNumber,
        text,
      });
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
        console.error(`[NotificationService] Erro ao enviar WhatsApp. Status: ${res.status}. Detalhes:`, errText);
        return false;
      }

      console.log(`[NotificationService] WhatsApp enviado com sucesso para ${formattedNumber}`);
      return true;
    } catch (err) {
      console.error('[NotificationService] Erro na requisição do WhatsApp:', err);
      return false;
    }
  }

  /**
   * Envia e-mail via serviço interno de SMTP do cliente
   */
  static async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    const smtpUrl = process.env.SMTP_SERVICE_URL;

    console.log(`[NotificationService] Preparando envio de E-mail para: ${to}`);

    if (!smtpUrl) {
      console.warn('[NotificationService] SMTP_SERVICE_URL não configurada no .env. Ignorando envio real e logando no console:', {
        to,
        subject,
        body,
      });
      return true; // Mock success
    }

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

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[NotificationService] Erro ao enviar E-mail. Status: ${res.status}. Detalhes:`, errText);
        return false;
      }

      console.log(`[NotificationService] E-mail enviado com sucesso para ${to}`);
      return true;
    } catch (err) {
      console.error('[NotificationService] Erro na requisição do E-mail:', err);
      return false;
    }
  }
}
