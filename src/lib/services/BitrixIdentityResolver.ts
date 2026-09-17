import { BitrixRawContactRow, BitrixRawDealRow } from '@/lib/domain/BitrixImportContract';
import { BitrixParserService } from './BitrixParserService';

export interface DealContactResolution {
  status: 'LINKED_EXISTING' | 'RECOVERED_FROM_SNAPSHOT' | 'REVIEW_REQUIRED';
  person: {
    fullName: string;
    email?: string;
    phone?: string;
    cpf?: string;
    source: string;
  } | null;
  recoveredFromSnapshot: boolean;
  reviewReason?: 'DEAL_WITHOUT_CONTACT' | 'AMBIGUOUS_IDENTITY';
}

export class BitrixIdentityResolver {
  /**
   * Resolve o vínculo de contato de um Deal:
   * 1. Busca pelo contactId na tabela/mapa de contatos
   * 2. Se órfão ou ausente, recupera dos campos expandidos Contato:*
   * 3. Se totalmente ausente, isola em REVIEW_REQUIRED
   */
  static resolveDealContact(
    deal: BitrixRawDealRow,
    contactsMap: Map<string, BitrixRawContactRow>
  ): DealContactResolution {
    // 1. Tentar achar pelo contactId no mapa de contatos
    if (deal.contactId && contactsMap.has(deal.contactId)) {
      const contact = contactsMap.get(deal.contactId)!;
      const fullName = BitrixParserService.composeFullName(contact.name, contact.lastName, contact.secondName);
      const email = BitrixParserService.sanitizeEmail(contact.email);
      const phone = BitrixParserService.sanitizePhone(contact.phone);

      return {
        status: 'LINKED_EXISTING',
        person: {
          fullName,
          email: email || undefined,
          phone: phone || undefined,
          cpf: contact.cpf || undefined,
          source: 'BITRIX'
        },
        recoveredFromSnapshot: false
      };
    }

    // 2. Se não encontrou no mapa, verificar snapshot Contato:* expandido no Deal
    const snapshotName = BitrixParserService.composeFullName(deal.contactName, deal.contactLastName);
    const snapshotEmail = BitrixParserService.sanitizeEmail(deal.contactEmail);
    const snapshotPhone = BitrixParserService.sanitizePhone(deal.contactPhone);

    const hasSnapshotData = (snapshotEmail || snapshotPhone || (snapshotName && snapshotName !== 'Contato Sem Nome'));

    if (hasSnapshotData) {
      return {
        status: 'RECOVERED_FROM_SNAPSHOT',
        person: {
          fullName: snapshotName || 'Contato Recuperado',
          email: snapshotEmail || undefined,
          phone: snapshotPhone || undefined,
          source: 'BITRIX_SNAPSHOT'
        },
        recoveredFromSnapshot: true
      };
    }

    // 3. Nenhuma informação de contato disponível -> Isolamento seguro
    return {
      status: 'REVIEW_REQUIRED',
      reviewReason: 'DEAL_WITHOUT_CONTACT',
      person: null,
      recoveredFromSnapshot: false
    };
  }
}
