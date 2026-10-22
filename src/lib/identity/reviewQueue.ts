/**
 * Fila de revisão alimentada pelas auditorias de identidade.
 *
 * Três tipos (marcados em IdentityReview.evidences, que a tela lê como lista de textos):
 *  - MERGE_SUGGESTED: mesma pessoa em duas fichas (e-mail igual + nome compatível).
 *  - PAIR_REVIEW:     par de dúvida (telefone igual, e-mail parecido, nomes divergentes...).
 *  - MIXED_SUSPECT:   suspeita de pessoas diferentes numa mesma ficha (só inspeção).
 *
 * Nada aqui junta ou separa fichas: só descreve o que entra na fila. A junção só
 * acontece quando um admin aprova na tela (IdentityMatchingService.resolveAuditReview).
 */
import {
  findDuplicatePairs,
  findMixedSuspects,
  pickSurvivor,
  type AuditPerson,
} from './identityAudit';

export const AUDIT_REVIEW_SOURCE = 'IDENTITY_AUDIT';

export type AuditReviewKind = 'MERGE_SUGGESTED' | 'PAIR_REVIEW' | 'MIXED_SUSPECT';

export const KIND_TAG = 'KIND:';
export const KEEP_TAG = 'KEEP:';       // ficha sugerida para ficar
export const ABSORB_TAG = 'ABSORB:';   // ficha sugerida para ser absorvida
export const PERSON_TAG = 'PERSON:';   // ficha inspecionada (MIXED_SUSPECT)
export const STRAY_TAG = 'STRAY_ALIAS:';
export const REASON_TAG = 'REASON:';
/** Pode ser aprovado em lote (com a lista visível): junção sugerida ou telefone + nome compatível. */
export const BATCHABLE_TAG = 'BATCHABLE';

export interface QueueItem {
  kind: AuditReviewKind;
  incomingExternalId: string; // chave estável → a carga pode rodar de novo sem duplicar
  candidatePersonId: string;
  confidenceScore: number;
  evidences: string[];
}

const tagValue = (evidences: unknown, prefix: string): string | null => {
  if (!Array.isArray(evidences)) return null;
  const tag = evidences.find((e): e is string => typeof e === 'string' && e.startsWith(prefix));
  return tag ? tag.slice(prefix.length) : null;
};

export const auditKindOf = (evidences: unknown) => tagValue(evidences, KIND_TAG) as AuditReviewKind | null;
export const keepPersonIdOf = (evidences: unknown) => tagValue(evidences, KEEP_TAG);
export const absorbPersonIdOf = (evidences: unknown) => tagValue(evidences, ABSORB_TAG);
export const inspectedPersonIdOf = (evidences: unknown) => tagValue(evidences, PERSON_TAG);
export const reasonOf = (evidences: unknown) => tagValue(evidences, REASON_TAG);
export const isBatchable = (evidences: unknown) => Array.isArray(evidences) && evidences.includes(BATCHABLE_TAG);
export const strayAliasIdsOf = (evidences: unknown): string[] =>
  Array.isArray(evidences)
    ? evidences.filter((e): e is string => typeof e === 'string' && e.startsWith(STRAY_TAG)).map(e => e.slice(STRAY_TAG.length))
    : [];

export function buildReviewQueue(persons: AuditPerson[]): QueueItem[] {
  const items: QueueItem[] = [];
  const { pairs, mergeClusters } = findDuplicatePairs(persons);

  // 1. Junções sugeridas: uma revisão por ficha a absorver, apontando para a que fica
  const clusterOf = new Map<string, number>();
  mergeClusters.forEach((cluster, idx) => {
    const keep = pickSurvivor(cluster);
    for (const member of cluster) {
      clusterOf.set(member.id, idx);
      if (member.id === keep.id) continue;
      items.push({
        kind: 'MERGE_SUGGESTED',
        incomingExternalId: `merge:${member.id}`,
        candidatePersonId: keep.id,
        confidenceScore: 90,
        evidences: [
          `${KIND_TAG}MERGE_SUGGESTED`, `${KEEP_TAG}${keep.id}`, `${ABSORB_TAG}${member.id}`,
          `${REASON_TAG}Mesmo e-mail e nome compatível`, BATCHABLE_TAG, 'EMAIL_EXACT', 'NAME_COMPATIBLE',
        ],
      });
    }
  });

  // 2. Pares de dúvida (exceto dentro de um mesmo grupo de junção, já tratado acima)
  for (const { a, b, result } of pairs) {
    if (result.decision !== 'REVIEW') continue;
    const ca = clusterOf.get(a.id);
    if (ca !== undefined && ca === clusterOf.get(b.id)) continue;
    const keep = pickSurvivor([a, b]);
    const other = keep.id === a.id ? b : a;
    const phoneAndName = result.evidences.includes('PHONE_EXACT')
      && result.evidences.includes('NAME_COMPATIBLE')
      && !result.evidences.includes('EMAIL_EXACT')
      && result.blockers.length === 0;
    const [low, high] = [a.id, b.id].sort();
    items.push({
      kind: 'PAIR_REVIEW',
      incomingExternalId: `pair:${low}:${high}`,
      candidatePersonId: keep.id,
      confidenceScore: phoneAndName ? 70 : 50,
      evidences: [
        `${KIND_TAG}PAIR_REVIEW`, `${KEEP_TAG}${keep.id}`, `${ABSORB_TAG}${other.id}`,
        `${REASON_TAG}${result.reason}`,
        ...(phoneAndName ? [BATCHABLE_TAG] : []),
        ...result.evidences, ...result.blockers,
      ],
    });
  }

  // 3. Suspeitas de ficha misturada: só inspeção, nunca separação automática
  for (const s of findMixedSuspects(persons)) {
    items.push({
      kind: 'MIXED_SUSPECT',
      incomingExternalId: `mixed:${s.person.id}`,
      candidatePersonId: s.person.id,
      confidenceScore: 0,
      evidences: [
        `${KIND_TAG}MIXED_SUSPECT`, `${PERSON_TAG}${s.person.id}`,
        `${REASON_TAG}${s.nameGroups} grupos de nomes incompatíveis na mesma ficha`,
        ...s.strays.flatMap(st => [...(st.aliasId ? [`${STRAY_TAG}${st.aliasId}`] : []), `SIGNAL_${st.signal}`]),
      ].filter((v, i, all) => all.indexOf(v) === i),
    });
  }

  return items;
}
