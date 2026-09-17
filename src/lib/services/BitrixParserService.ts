export class BitrixParserService {
  /**
   * Normaliza números de telefone para o padrão internacional E.164 brasileiro (+55...)
   */
  static sanitizePhone(phone?: string | null): string | null {
    if (!phone) return null;
    
    // Remove todos os caracteres não numéricos
    const digits = phone.replace(/\D/g, '');
    if (!digits || digits.length < 10) return null;

    // Se já começa com 55 e tem 12 ou 13 dígitos
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      return `+${digits}`;
    }

    // Se começa com 0 seguido do DDD (ex: 044998762228 -> 44998762228)
    if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
      return `+55${digits.substring(1)}`;
    }

    // Se possui 10 ou 11 dígitos (DDD + número)
    if (digits.length === 10 || digits.length === 11) {
      return `+55${digits}`;
    }

    // Fallback: se tiver entre 10 e 15 dígitos
    if (digits.length >= 10 && digits.length <= 15) {
      return `+${digits.startsWith('55') ? digits : '55' + digits}`;
    }

    return null;
  }

  /**
   * Normaliza e sanitiza e-mails
   */
  static sanitizeEmail(email?: string | null): string | null {
    if (!email) return null;
    const cleaned = email.trim().toLowerCase();
    
    // Validação básica de RFC
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleaned)) return null;

    return cleaned;
  }

  /**
   * Compõe o nome completo a partir dos fragmentos do Bitrix
   */
  static composeFullName(name?: string, lastName?: string, secondName?: string): string {
    const parts = [name, secondName, lastName]
      .map(p => (p || '').trim())
      .filter(Boolean);

    return parts.length > 0 ? parts.join(' ') : 'Contato Sem Nome';
  }

  /**
   * Converte valores financeiros (strings em BRL ou números) em float seguro
   */
  static parseValue(val?: string | number | null): number {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;

    let str = String(val).trim();
    // Ex: "R$ 1.500,50" ou "1500.50"
    str = str.replace(/[R$\s]/g, '');
    
    // Se possui formato brasileiro "1.500,50"
    if (str.includes(',') && str.includes('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
      str = str.replace(',', '.');
    }

    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }
}
