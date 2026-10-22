import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { IdentityMatchingService } from '@/lib/services/IdentityMatchingService';
import {
  AUDIT_REVIEW_SOURCE,
  KIND_TAG,
  absorbPersonIdOf,
  inspectedPersonIdOf,
  isBatchable,
  keepPersonIdOf,
  reasonOf,
  strayAliasIdsOf,
  type AuditReviewKind,
} from '@/lib/identity/reviewQueue';

const KINDS: AuditReviewKind[] = ['MERGE_SUGGESTED', 'PAIR_REVIEW', 'MIXED_SUSPECT'];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any)?.role !== 'ADMIN') return null;
  return session;
}

const personSelect = {
  id: true, fullName: true, email: true, secondaryEmail: true, phoneNumber: true, secondaryPhone: true,
  source: true, createdAt: true,
  identityAliases: { select: { id: true, source: true, name: true, email: true, phone: true } },
  customers: { select: { id: true, opportunities: { select: { product: { select: { name: true } } } } } },
} as const;

function describePerson(p: any) {
  return {
    id: p.id,
    fullName: p.fullName,
    email: p.email,
    secondaryEmail: p.secondaryEmail,
    phoneNumber: p.phoneNumber,
    secondaryPhone: p.secondaryPhone,
    source: p.source,
    createdAt: p.createdAt,
    aliasCount: p.identityAliases.length,
    customerCount: p.customers.length,
    products: [...new Set(p.customers.flatMap((c: any) => c.opportunities.map((o: any) => o.product?.name).filter(Boolean)))],
  };
}

/**
 * GET /api/leads/identity-review/audit?kind=MERGE_SUGGESTED&batchable=1&limit=50&offset=0
 * Fila de revisão gerada pela auditoria de identidade (somente ADMIN).
 */
export async function GET(request: Request) {
  if (!(await requireAdmin())) return new Response('Unauthorized', { status: 403 });

  const { searchParams } = new URL(request.url);
  const kind = (searchParams.get('kind') || 'MERGE_SUGGESTED') as AuditReviewKind;
  if (!KINDS.includes(kind)) return NextResponse.json({ success: false, error: 'Tipo inválido.' }, { status: 400 });
  const onlyBatchable = searchParams.get('batchable') === '1';
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 200);
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

  const open = { incomingSource: AUDIT_REVIEW_SOURCE, status: { in: ['PENDING', 'DEFERRED'] } };
  const kindFilter = (k: AuditReviewKind) => ({ ...open, evidences: { array_contains: [`${KIND_TAG}${k}`] } });
  const where = onlyBatchable
    ? { AND: [kindFilter(kind), { evidences: { array_contains: ['BATCHABLE'] } }] }
    : kindFilter(kind);

  const [reviews, total, counts] = await Promise.all([
    prisma.identityReview.findMany({ where, orderBy: [{ confidenceScore: 'desc' }, { createdAt: 'asc' }], skip: offset, take: limit }),
    prisma.identityReview.count({ where }),
    Promise.all(KINDS.map(async k => [k, await prisma.identityReview.count({ where: kindFilter(k) })] as const)),
  ]);

  const personIds = [...new Set(reviews.flatMap(r =>
    [keepPersonIdOf(r.evidences), absorbPersonIdOf(r.evidences), inspectedPersonIdOf(r.evidences)].filter((id): id is string => !!id)))];
  const persons = new Map(
    (await prisma.person.findMany({ where: { id: { in: personIds } }, select: personSelect })).map(p => [p.id, p]),
  );

  const data = reviews.map(r => {
    const base = {
      id: r.id,
      kind,
      status: r.status,
      decision: r.decision,
      reason: reasonOf(r.evidences),
      evidences: (r.evidences as string[]).filter(e => !/^(KIND|KEEP|ABSORB|PERSON|STRAY_ALIAS|REASON):/.test(e)),
      batchable: isBatchable(r.evidences),
      createdAt: r.createdAt,
    };
    if (kind === 'MIXED_SUSPECT') {
      const person = persons.get(inspectedPersonIdOf(r.evidences) || '');
      const strays = new Set(strayAliasIdsOf(r.evidences));
      return {
        ...base,
        obsolete: !person,
        person: person ? describePerson(person) : null,
        aliases: person?.identityAliases.map(a => ({ ...a, suspicious: strays.has(a.id) })) ?? [],
      };
    }
    const keep = persons.get(keepPersonIdOf(r.evidences) || '');
    const absorb = persons.get(absorbPersonIdOf(r.evidences) || '');
    return {
      ...base,
      obsolete: !keep || !absorb,
      keep: keep ? describePerson(keep) : null,
      absorb: absorb ? describePerson(absorb) : null,
    };
  });

  return NextResponse.json({ success: true, data, total, counts: Object.fromEntries(counts) });
}

/**
 * POST /api/leads/identity-review/audit
 *  { action: 'MERGE', reviewId, keepPersonId? }
 *  { action: 'KEEP_SEPARATE' | 'CONFIRM_SAME' | 'NEEDS_SPLIT', reviewId }
 *  { action: 'BATCH_MERGE', reviewIds: string[] }   // só itens aprováveis em lote
 */
export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return new Response('Unauthorized', { status: 403 });
  const userId = (session.user as any).id || '';

  try {
    const body = await request.json();
    const { action, reviewId, keepPersonId, reviewIds } = body;

    if (action === 'BATCH_MERGE') {
      if (!Array.isArray(reviewIds) || reviewIds.length === 0 || reviewIds.length > 200) {
        return NextResponse.json({ success: false, error: 'Envie de 1 a 200 revisões selecionadas.' }, { status: 400 });
      }
      const results = await IdentityMatchingService.resolveAuditReviewsBatch(reviewIds, userId);
      return NextResponse.json({ success: true, results });
    }

    if (!reviewId || !['MERGE', 'KEEP_SEPARATE', 'CONFIRM_SAME', 'NEEDS_SPLIT'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Informe action e reviewId válidos.' }, { status: 400 });
    }
    const result = await IdentityMatchingService.resolveAuditReview(reviewId, action, userId, keepPersonId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('POST identity-review/audit error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
