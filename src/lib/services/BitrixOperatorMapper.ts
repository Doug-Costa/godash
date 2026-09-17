import { BitrixOperatorMap } from '@/lib/domain/BitrixImportContract';

export interface OperatorMappingResolution {
  assignedToUserId?: string;
  humanTakeover: boolean;
  isMapped: boolean;
  operatorName?: string;
}

export class BitrixOperatorMapper {
  /**
   * Mapeia o operador do Bitrix para o usuário do CRM e ativa salvaguarda humanTakeover
   */
  static mapOperator(
    assignedByNameOrId?: string,
    operatorMaps: BitrixOperatorMap[] = []
  ): OperatorMappingResolution {
    if (!assignedByNameOrId) {
      return {
        assignedToUserId: undefined,
        humanTakeover: false,
        isMapped: false
      };
    }

    const normalizedSearch = assignedByNameOrId.trim().toLowerCase();
    const found = operatorMaps.find(m => 
      m.bitrixNameOrId.trim().toLowerCase() === normalizedSearch ||
      m.crmUserName.trim().toLowerCase() === normalizedSearch
    );

    if (found && found.crmUserId) {
      return {
        assignedToUserId: found.crmUserId,
        humanTakeover: true, // Salvaguarda: protege o atendimento ativo da operadora
        isMapped: true,
        operatorName: found.crmUserName
      };
    }

    return {
      assignedToUserId: undefined,
      humanTakeover: false,
      isMapped: false,
      operatorName: assignedByNameOrId
    };
  }
}
