import { BitrixRawDealRow, BitrixDealClassification } from '@/lib/domain/BitrixImportContract';

export interface DealClassificationResult {
  classification: BitrixDealClassification;
  status: 'OPEN' | 'WON' | 'LOST';
  operationalVisibility: 'OPERATIONAL' | 'ARCHIVED' | 'REVIEW_REQUIRED';
  stage: string;
  lossReason?: string;
  isRecent: boolean;
}

export class BitrixDealClassifier {
  /**
   * Classifica o negócio do Bitrix separando Fato Histórico (WON/LOST/DORMANT)
   * de Operação Ativa (Kanban) com base na régua de recência.
   */
  static classify(
    deal: BitrixRawDealRow,
    recencyCutoffDays: number = 90,
    referenceDate: Date = new Date()
  ): DealClassificationResult {
    const stageId = (deal.stageId || '').toUpperCase();
    const semantic = (deal.stageSemanticId || '').toUpperCase();

    // 1. Venda Realizada / Ganho (WON)
    if (semantic === 'S' || stageId.includes('WON') || stageId.includes('REALIZADA') || stageId.includes('SUCESSO')) {
      return {
        classification: 'WON',
        status: 'WON',
        operationalVisibility: 'ARCHIVED',
        stage: 'ganho',
        isRecent: false
      };
    }

    // 2. Negócio Perdido (LOST)
    if (semantic === 'F' || stageId.includes('LOSE') || stageId.includes('LOST') || stageId.includes('PERDIDO') || stageId.includes('CANCEL')) {
      return {
        classification: 'LOST',
        status: 'LOST',
        operationalVisibility: 'ARCHIVED',
        stage: 'perdido',
        lossReason: deal.lossReason || 'Perda registrada no Bitrix',
        isRecent: false
      };
    }

    // 3. Stand By / Em Espera
    if (stageId.includes('STAND') || stageId.includes('HOLD') || stageId.includes('ESPERA')) {
      return {
        classification: 'STAND_BY',
        status: 'OPEN',
        operationalVisibility: 'ARCHIVED',
        stage: 'stand_by',
        isRecent: false
      };
    }

    // 4. Negócios Abertos (Progress/Open): Avaliar Recência
    const lastActivityStr = deal.dateModify || deal.dateCreate;
    let isRecent = false;

    if (lastActivityStr) {
      const lastActivityDate = new Date(lastActivityStr);
      if (!isNaN(lastActivityDate.getTime())) {
        const diffTime = Math.abs(referenceDate.getTime() - lastActivityDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isRecent = diffDays <= recencyCutoffDays;
      }
    }

    if (isRecent) {
      return {
        classification: 'OPEN_ACTIVE',
        status: 'OPEN',
        operationalVisibility: 'OPERATIONAL',
        stage: 'atendimento',
        isRecent: true
      };
    }

    // Negócio Aberto mas Antigo / Dormente
    return {
      classification: 'OPEN_DORMANT',
      status: 'OPEN',
      operationalVisibility: 'ARCHIVED',
      stage: 'novo_cadastro',
      isRecent: false
    };
  }
}
