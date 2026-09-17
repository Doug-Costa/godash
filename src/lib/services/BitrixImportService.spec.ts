import { describe, it, expect } from 'vitest';
import { BitrixParserService } from './BitrixParserService';
import { BitrixIdentityResolver } from './BitrixIdentityResolver';
import { BitrixDealClassifier } from './BitrixDealClassifier';
import { BitrixProductResolver } from './BitrixProductResolver';
import { BitrixRawContactRow, BitrixRawDealRow } from '@/lib/domain/BitrixImportContract';

describe('Bitrix Ingestion Suite (TDD)', () => {
  describe('1. BitrixParserService - Parsing & Sanitization', () => {
    it('should sanitize phone numbers to E.164 Brazilian format', () => {
      expect(BitrixParserService.sanitizePhone('(44) 99876-2228')).toBe('+5544998762228');
      expect(BitrixParserService.sanitizePhone('44998762228')).toBe('+5544998762228');
      expect(BitrixParserService.sanitizePhone('+55 (44) 99876-2228')).toBe('+5544998762228');
      expect(BitrixParserService.sanitizePhone('044998762228')).toBe('+5544998762228');
      expect(BitrixParserService.sanitizePhone('12345')).toBeNull(); // Inválido
      expect(BitrixParserService.sanitizePhone('')).toBeNull();
    });

    it('should sanitize and normalize email to lowercase and trimmed', () => {
      expect(BitrixParserService.sanitizeEmail(' Teste.Usuario@Dentalgo.com.br ')).toBe('teste.usuario@dentalgo.com.br');
      expect(BitrixParserService.sanitizeEmail('invalido-sem-arroba')).toBeNull();
      expect(BitrixParserService.sanitizeEmail('')).toBeNull();
    });

    it('should extract full name accurately from parts or fallback to single string', () => {
      expect(BitrixParserService.composeFullName('Guilherme', 'Silva', 'Henrique')).toBe('Guilherme Henrique Silva');
      expect(BitrixParserService.composeFullName('Thais', 'Mazzo')).toBe('Thais Mazzo');
      expect(BitrixParserService.composeFullName('Rogéria', '')).toBe('Rogéria');
    });

    it('should parse financial value safely', () => {
      expect(BitrixParserService.parseValue('1.500,50')).toBe(1500.50);
      expect(BitrixParserService.parseValue('2500')).toBe(2500);
      expect(BitrixParserService.parseValue(3400.75)).toBe(3400.75);
      expect(BitrixParserService.parseValue('')).toBe(0);
      expect(BitrixParserService.parseValue(undefined)).toBe(0);
    });
  });

  describe('2. BitrixIdentityResolver - Orphan Recovery & Contact Linking', () => {
    const mockContactsMap = new Map<string, BitrixRawContactRow>([
      ['C101', { id: 'C101', name: 'Thais', lastName: 'Silva', email: 'thais@exemplo.com', phone: '44999990001' }],
      ['C102', { id: 'C102', name: 'Jucelia', lastName: 'Ribeiro', email: 'jucelia@exemplo.com', phone: '44999990002' }]
    ]);

    it('should link deal directly when contactId is present in contacts map', () => {
      const deal: BitrixRawDealRow = {
        id: 'D1',
        title: 'Curso de Prótese',
        contactId: 'C101'
      };

      const result = BitrixIdentityResolver.resolveDealContact(deal, mockContactsMap);
      expect(result.status).toBe('LINKED_EXISTING');
      expect(result.person?.fullName).toBe('Thais Silva');
      expect(result.person?.email).toBe('thais@exemplo.com');
      expect(result.recoveredFromSnapshot).toBe(false);
    });

    it('should recover person from snapshot Contato:* when contactId is missing or orphan', () => {
      const dealWithSnapshot: BitrixRawDealRow = {
        id: 'D761',
        title: 'Imersão em Alinhadores',
        contactId: 'C999_ORPHAN',
        contactName: 'Carlos',
        contactLastName: 'Eduardo',
        contactEmail: 'carlos.eduardo@exemplo.com',
        contactPhone: '11988887777'
      };

      const result = BitrixIdentityResolver.resolveDealContact(dealWithSnapshot, mockContactsMap);
      expect(result.status).toBe('RECOVERED_FROM_SNAPSHOT');
      expect(result.person?.fullName).toBe('Carlos Eduardo');
      expect(result.person?.email).toBe('carlos.eduardo@exemplo.com');
      expect(result.person?.phone).toBe('+5511988887777');
      expect(result.recoveredFromSnapshot).toBe(true);
    });

    it('should flag deal as REVIEW_REQUIRED when no contactId and no snapshot is available', () => {
      const dealWithoutContact: BitrixRawDealRow = {
        id: 'D26',
        title: 'Proposta Avulsa Sem Contato',
        contactId: undefined,
        contactName: undefined,
        contactEmail: undefined,
        contactPhone: undefined
      };

      const result = BitrixIdentityResolver.resolveDealContact(dealWithoutContact, mockContactsMap);
      expect(result.status).toBe('REVIEW_REQUIRED');
      expect(result.reviewReason).toBe('DEAL_WITHOUT_CONTACT');
      expect(result.person).toBeNull();
    });
  });

  describe('3. BitrixDealClassifier - Recency, Stages & Operational Visibility', () => {
    it('should classify WON deals as ARCHIVED with status WON', () => {
      const wonDeal: BitrixRawDealRow = {
        id: 'D10',
        stageId: 'WON',
        stageSemanticId: 'S',
        dateModify: '2026-08-01T10:00:00Z'
      };

      const classification = BitrixDealClassifier.classify(wonDeal, 90, new Date('2026-09-17T12:00:00Z'));
      expect(classification.status).toBe('WON');
      expect(classification.operationalVisibility).toBe('ARCHIVED');
    });

    it('should classify LOST deals as ARCHIVED with status LOST', () => {
      const lostDeal: BitrixRawDealRow = {
        id: 'D11',
        stageId: 'LOSE',
        stageSemanticId: 'F',
        lossReason: 'Preço elevado',
        dateModify: '2026-08-01T10:00:00Z'
      };

      const classification = BitrixDealClassifier.classify(lostDeal, 90, new Date('2026-09-17T12:00:00Z'));
      expect(classification.status).toBe('LOST');
      expect(classification.operationalVisibility).toBe('ARCHIVED');
      expect(classification.lossReason).toBe('Preço elevado');
    });

    it('should classify recent open deal (< cutoff days) as OPERATIONAL (Kanban)', () => {
      const recentOpenDeal: BitrixRawDealRow = {
        id: 'D12',
        stageId: 'C1:EXECUTING',
        stageSemanticId: 'P',
        dateModify: '2026-09-10T10:00:00Z' // 7 dias atrás
      };

      const classification = BitrixDealClassifier.classify(recentOpenDeal, 90, new Date('2026-09-17T12:00:00Z'));
      expect(classification.status).toBe('OPEN');
      expect(classification.operationalVisibility).toBe('OPERATIONAL');
      expect(classification.stage).toBe('atendimento');
    });

    it('should classify old open deal (> cutoff days) as DORMANT/ARCHIVED without cluttering Kanban', () => {
      const oldOpenDeal: BitrixRawDealRow = {
        id: 'D13',
        stageId: 'C1:NEW',
        stageSemanticId: 'P',
        dateModify: '2026-01-10T10:00:00Z' // ~8 meses atrás (> 90 dias)
      };

      const classification = BitrixDealClassifier.classify(oldOpenDeal, 90, new Date('2026-09-17T12:00:00Z'));
      expect(classification.status).toBe('OPEN');
      expect(classification.operationalVisibility).toBe('ARCHIVED');
      expect(classification.classification).toBe('OPEN_DORMANT');
    });
  });

  describe('4. BitrixProductResolver - 3-Level Resolution without Catalog Pollution', () => {
    const mockRules = [
      { bitrixFormId: '182', crmProductId: 'prod-protese-123' },
      { bitrixTitlePattern: 'Imersão em Resinas', crmProductId: 'prod-resinas-456' }
    ];

    it('Level 1: should resolve to official product when formId or title pattern matches', () => {
      const dealWithForm: BitrixRawDealRow = {
        id: 'D100',
        formId: '182',
        title: 'Lead Form 182'
      };

      const res = BitrixProductResolver.resolve(dealWithForm, mockRules);
      expect(res.level).toBe('CONFIRMED_PRODUCT');
      expect(res.productId).toBe('prod-protese-123');
    });

    it('Level 2: should extract specialty interest tags when interest area is present', () => {
      const dealWithInterest: BitrixRawDealRow = {
        id: 'D101',
        title: 'Interesse Odontologia',
        interestArea: 'Ortodontia; Cirurgia'
      };

      const res = BitrixProductResolver.resolve(dealWithInterest, mockRules);
      expect(res.level).toBe('INTEREST_TAG');
      expect(res.productId).toBeUndefined();
      expect(res.interestTags).toContain('Ortodontia');
      expect(res.interestTags).toContain('Cirurgia');
    });

    it('Level 3: should fallback safely to legacy title without creating fake product', () => {
      const dealGeneric: BitrixRawDealRow = {
        id: 'D102',
        title: 'Atendimento Avulso de Balcão'
      };

      const res = BitrixProductResolver.resolve(dealGeneric, mockRules);
      expect(res.level).toBe('LEGACY_TITLE');
      expect(res.productId).toBeUndefined();
      expect(res.legacyDealTitle).toBe('Atendimento Avulso de Balcão');
    });
  });
});
