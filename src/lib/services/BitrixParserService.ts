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

  /**
   * Converte strings de datas em formatos comuns do Bitrix (ex: "16/09/2026 14:30:00", "16.09.2026", "2026-09-16") em Date válido.
   */
  static parseDate(dateStr?: string | null): Date | null {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const trimmed = dateStr.trim();
    if (!trimmed) return null;

    // 1. Padrão brasileiro DD/MM/YYYY ou DD.MM.YYYY ou DD-MM-YYYY (com ou sem hora)
    const brMatch = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (brMatch) {
      const day = parseInt(brMatch[1], 10);
      const month = parseInt(brMatch[2], 10) - 1; // 0-indexed
      const year = parseInt(brMatch[3], 10);
      const hour = brMatch[4] ? parseInt(brMatch[4], 10) : 0;
      const min = brMatch[5] ? parseInt(brMatch[5], 10) : 0;
      const sec = brMatch[6] ? parseInt(brMatch[6], 10) : 0;

      const d = new Date(year, month, day, hour, min, sec);
      return isNaN(d.getTime()) ? null : d;
    }

    // 2. Formato ISO padrão YYYY-MM-DD
    const isoDate = new Date(trimmed);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    return null;
  }
}
