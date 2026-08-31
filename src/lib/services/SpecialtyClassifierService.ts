/**
 * SpecialtyClassifierService
 * Serviço de taxonomia e inferência inteligente de especialidades odontológicas
 * com base em títulos de cursos, livros, descrições e códigos legados.
 */

export interface SpecialtyDefinition {
  key: string;
  label: string;
  icon: string;
  keywords: string[];
  courseCodes?: (string | number)[];
}

export const DENTAL_SPECIALTIES: Record<string, SpecialtyDefinition> = {
  ORTODONTIA: {
    key: 'ORTODONTIA',
    label: 'Ortodontia',
    icon: '🦷',
    keywords: [
      'ortodontia', 'ortodont', 'ortopedi', 'alinhador', 'alinhadores',
      'mini-implante', 'mini-implantes', 'extrarradiculares', 'apm', 'marpe',
      'mecanica ortodontica', 'autoligado', 'autoligados', 'agnesia'
    ],
    courseCodes: [23, 45, 62, 65, 68, 78, 82, 90, 96, 100]
  },
  DTM_DOR_OROFACIAL: {
    key: 'DTM_DOR_OROFACIAL',
    label: 'DTM & Dor Orofacial',
    icon: '💆',
    keywords: [
      'dtm', 'dor orofacial', 'bruxismo', 'oclusao', 'placa oclusal',
      'placas oclusais', 'sono', 'odontologia do sono', 'mentoria do sono'
    ],
    courseCodes: [28, 58, 72, 80, 85]
  },
  IMPLANTODONTIA: {
    key: 'IMPLANTODONTIA',
    label: 'Implantodontia',
    icon: '🔩',
    keywords: [
      'implantodontia', 'implante', 'implantes', 'enxerto', 'enxertos',
      'enxerto osseo', 'enxertos osseos', 'osseodensificacao', 'osseodensificação'
    ],
    courseCodes: [42, 52, 79, 99]
  },
  DENTISTICA_ESTETICA: {
    key: 'DENTISTICA_ESTETICA',
    label: 'Dentística & Estética',
    icon: '✨',
    keywords: [
      'dentistica', 'dentística', 'restauradora', 'laminado', 'laminados',
      'ceramico', 'cerâmico', 'lentes de contato', 'resina', 'resinas',
      'estetica vermelha e branca', 'estética vermelha', 'dentes posteriores',
      'solucoes restauradoras'
    ],
    courseCodes: [27, 51, 60, 74, 97, 98]
  },
  PROTESE_DENTARIA: {
    key: 'PROTESE_DENTARIA',
    label: 'Prótese Dentária',
    icon: '👑',
    keywords: [
      'protese', 'prótese', 'protese sobre implante', 'proteses',
      'reabilitacao oral', 'reabilitação estetica e funcional', 'reabilitador'
    ],
    courseCodes: [43, 75, 76]
  },
  ENDODONTIA: {
    key: 'ENDODONTIA',
    label: 'Endodontia',
    icon: '🔬',
    keywords: [
      'endodontia', 'endodont', 'endoday', 'canal', 'microscopia endodontica',
      'reciprocante', 'obturação', 'tratamento de canal'
    ],
    courseCodes: [44, 48, 73]
  },
  HARMONIZACAO_FACIAL: {
    key: 'HARMONIZACAO_FACIAL',
    label: 'Harmonização Orofacial',
    icon: '💉',
    keywords: [
      'harmonizacao', 'harmonização', 'hof', 'toxina', 'botox', 'botulinica',
      'preenchimento', 'simetria labial', 'fios de pdo', 'escultura labial'
    ],
    courseCodes: [84, 88, 94]
  },
  PERIODONTIA: {
    key: 'PERIODONTIA',
    label: 'Periodontia',
    icon: '🩺',
    keywords: [
      'periodontia', 'periodontal', 'plastica periodontal', 'plástica periodontal',
      'periimplantar', 'sorriso gengival', 'recobrimento radicular'
    ],
    courseCodes: [34, 77]
  },
  CIRURGIA_BUCOMAXILO: {
    key: 'CIRURGIA_BUCOMAXILO',
    label: 'Cirurgia Bucomaxilofacial',
    icon: '🔪',
    keywords: [
      'cirurgia', 'bucomaxilo', 'dentes retidos', 'dente retido', 'siso',
      'terceiro molar', 'bichectomia'
    ],
    courseCodes: [26]
  },
  TERAPIAS_INTEGRATIVAS: {
    key: 'TERAPIAS_INTEGRATIVAS',
    label: 'Terapias Integrativas & Cannabis',
    icon: '🌿',
    keywords: [
      'cannabis', 'canabidiol', 'cbd', 'fitoterapia', 'integrativa',
      'laserterapia', 'fotobiomodulacao'
    ],
    courseCodes: [81]
  },
  GESTAO_MARKETING: {
    key: 'GESTAO_MARKETING',
    label: 'Gestão & Marketing',
    icon: '📈',
    keywords: [
      'gestao', 'gestão', 'marketing', 'documentacao audiovisual',
      'audiovisual', 'fotografia odontologica', 'vendas para dentistas'
    ],
    courseCodes: [92]
  },
  CLINICA_GERAL: {
    key: 'CLINICA_GERAL',
    label: 'Clínica Geral',
    icon: '🏥',
    keywords: [
      'clinica geral', 'clinico geral', 'odontologia', 'curso geral'
    ],
    courseCodes: []
  }
};

export class SpecialtyClassifierService {
  /**
   * Normaliza um texto para comparação limpa
   */
  private static normalize(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Classifica a especialidade por código numérico de curso legado
   */
  static classifyByCode(code: string | number): string | null {
    if (!code) return null;
    const numCode = Number(code);
    if (isNaN(numCode)) return null;

    for (const [key, spec] of Object.entries(DENTAL_SPECIALTIES)) {
      if (spec.courseCodes && spec.courseCodes.includes(numCode)) {
        return key;
      }
    }
    return null;
  }

  /**
   * Infere a especialidade a partir de um título de produto, curso, livro ou descrição
   */
  static classifyByText(text?: string | null): string {
    if (!text || typeof text !== 'string') return 'CLINICA_GERAL';

    const normalized = this.normalize(text);

    // Score por quantidade de termos encontrados
    let bestMatchKey = 'CLINICA_GERAL';
    let highestScore = 0;

    for (const [key, spec] of Object.entries(DENTAL_SPECIALTIES)) {
      let currentScore = 0;
      for (const kw of spec.keywords) {
        const normKw = this.normalize(kw);
        if (normalized.includes(normKw)) {
          // Peso maior para matches mais longos e específicos
          currentScore += normKw.length;
        }
      }

      if (currentScore > highestScore) {
        highestScore = currentScore;
        bestMatchKey = key;
      }
    }

    return bestMatchKey;
  }

  /**
   * Resolve a especialidade combinando código (se houver) e texto
   */
  static resolveSpecialty(params: { code?: string | number | null; text?: string | null }): string {
    if (params.code) {
      const byCode = this.classifyByCode(params.code);
      if (byCode) return byCode;
    }

    if (params.text) {
      return this.classifyByText(params.text);
    }

    return 'CLINICA_GERAL';
  }

  /**
   * Retorna o Label amigável da especialidade
   */
  static getSpecialtyLabel(key: string): string {
    return DENTAL_SPECIALTIES[key]?.label || key;
  }

  /**
   * Retorna o Ícone correspondente
   */
  static getSpecialtyIcon(key: string): string {
    return DENTAL_SPECIALTIES[key]?.icon || '🦷';
  }

  /**
   * Lista todas as especialidades cadastradas
   */
  static getAllSpecialties(): { key: string; label: string; icon: string }[] {
    return Object.values(DENTAL_SPECIALTIES).map(s => ({
      key: s.key,
      label: s.label,
      icon: s.icon
    }));
  }
}
