import { describe, expect, it } from 'vitest';
import type { AuditPerson } from './identityAudit';
import {
  absorbPersonIdOf,
  auditKindOf,
  buildReviewQueue,
  inspectedPersonIdOf,
  isBatchable,
  keepPersonIdOf,
  strayAliasIdsOf,
} from './reviewQueue';

let seq = 0;
const person = (p: Partial<AuditPerson> & { id: string }): AuditPerson => ({
  source: 'CSV_IMPORT',
  createdAt: new Date(2025, 0, 1 + seq++),
  fullName: null, email: null, secondaryEmail: null, phoneNumber: null, secondaryPhone: null, cpf: null,
  identityAliases: [],
  ...p,
});

describe('buildReviewQueue', () => {
  it('junção sugerida: fica a ficha FATO (DentalGO), a do Bitrix é absorvida, aprovável em lote', () => {
    const items = buildReviewQueue([
      person({ id: 'bitrix', source: 'BITRIX', fullName: 'Douglas Costa', email: 'dc@teste.com' }),
      person({ id: 'dentalgo', source: 'DENTALGO', fullName: 'Douglas Henrique Costa', email: 'dc@teste.com' }),
    ]);
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(auditKindOf(item.evidences)).toBe('MERGE_SUGGESTED');
    expect(keepPersonIdOf(item.evidences)).toBe('dentalgo');
    expect(absorbPersonIdOf(item.evidences)).toBe('bitrix');
    expect(item.candidatePersonId).toBe('dentalgo');
    expect(isBatchable(item.evidences)).toBe(true);
    expect(item.incomingExternalId).toBe('merge:bitrix');
  });

  it('grupo de 3 fichas da mesma pessoa vira 2 revisões apontando para a mesma ficha', () => {
    const items = buildReviewQueue([
      person({ id: 'a', source: 'BITRIX', fullName: 'Ana Lima', email: 'ana@teste.com' }),
      person({ id: 'b', source: 'DENTALGO', fullName: 'Ana Paula Lima', email: 'ana@teste.com' }),
      person({ id: 'c', source: 'Form Capture: curso', fullName: 'Ana Lima', email: 'ana@teste.com' }),
    ]).filter(i => auditKindOf(i.evidences) === 'MERGE_SUGGESTED');
    expect(items).toHaveLength(2);
    expect(new Set(items.map(i => keepPersonIdOf(i.evidences)))).toEqual(new Set(['b']));
  });

  it('telefone igual + nome compatível: par de dúvida aprovável em lote', () => {
    const [item] = buildReviewQueue([
      person({ id: 'x', fullName: 'Bruno Reis', phoneNumber: '44991234567' }),
      person({ id: 'y', source: 'BITRIX', fullName: 'Bruno Reis Souza', phoneNumber: '+5544991234567' }),
    ]);
    expect(auditKindOf(item.evidences)).toBe('PAIR_REVIEW');
    expect(isBatchable(item.evidences)).toBe(true);
    expect(item.incomingExternalId).toBe('pair:x:y');
  });

  it('e-mail da clínica com nomes diferentes: par de dúvida, NUNCA em lote', () => {
    const [item] = buildReviewQueue([
      person({ id: 'm', fullName: 'Maria Silva', email: 'contato@clinica.com' }),
      person({ id: 'j', fullName: 'João Pereira', email: 'contato@clinica.com' }),
    ]);
    expect(auditKindOf(item.evidences)).toBe('PAIR_REVIEW');
    expect(isBatchable(item.evidences)).toBe(false);
  });

  it('ficha com nomes incompatíveis: suspeita para inspeção, com o alias estranho marcado', () => {
    const items = buildReviewQueue([
      person({
        id: 'p', source: 'DENTALGO', fullName: 'Maria Silva', phoneNumber: '+5511911112222',
        identityAliases: [{ id: 'al-1', source: 'BITRIX_DEAL', name: 'Carlos Mendes', email: null, phone: '+5511911112222' }],
      }),
    ]);
    expect(items).toHaveLength(1);
    expect(auditKindOf(items[0].evidences)).toBe('MIXED_SUSPECT');
    expect(inspectedPersonIdOf(items[0].evidences)).toBe('p');
    expect(strayAliasIdsOf(items[0].evidences)).toEqual(['al-1']);
    expect(items[0].evidences).toContain('SIGNAL_TELEFONE');
    expect(isBatchable(items[0].evidences)).toBe(false);
  });

  it('pessoas sem nada em comum não entram na fila', () => {
    expect(buildReviewQueue([
      person({ id: '1', fullName: 'Douglas Costa', email: 'a@teste.com' }),
      person({ id: '2', fullName: 'Douglas Costa', email: 'b@teste.com' }),
    ])).toEqual([]);
  });
});
