/**
 * sync-dentalgo-people.ts — GRAVA a ligação da base do DentalGO (MySQL `people`, sem
 * administradores) às fichas do CRM. Rode antes a simulação: prisma/simulate-dentalgo-sync.ts.
 *
 * Mesmas regras da simulação e das entradas do dia a dia (CanonicalIdentityService.resolveDentalGoPerson):
 * junta só com e-mail igual + nome compatível sem conflito; caso duvidoso ganha ficha própria +
 * revisão; ficha com OUTRO ID do DentalGO não recebe segunda conta; telefones fictícios e
 * genéricos (5+ contas) não contam. Só completa campos vazios — nunca sobrescreve nem apaga.
 * Não grava nada no DentalGO.
 *
 * Uso:
 *   docker exec -it dentalgo-bi npx tsx prisma/sync-dentalgo-people.ts --apply --limit 500   # lote de teste
 *   docker exec -it dentalgo-bi npx tsx prisma/sync-dentalgo-people.ts --apply --from-id <N> # continua
 *   docker exec -it dentalgo-bi npx tsx prisma/sync-dentalgo-people.ts --apply               # base inteira
 *
 * Uma conta de cada vez, em ordem de ID. Pode parar e retomar: contas já gravadas são
 * reconhecidas pelo ID do DentalGO (rodar de novo não duplica nada). Cada execução fica
 * registrada em DomainEvent (IDENTITY_DENTALGO_SYNC) com as contagens e o ponto de retomada.
 * Mostra só contagens e IDs do DentalGO.
 */
import prisma from '../src/lib/prisma';
import pool from '../src/lib/db';
import { CanonicalIdentityService } from '../src/lib/services/CanonicalIdentityService';
import { requireGenericPhones, setGenericPhonesProvider } from '../src/lib/identity/genericPhones';
import { emptySyncSummary, runDentalGoSync } from '../src/lib/identity/dentalGoSync';

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const APPLY = process.argv.includes('--apply');
const LIMIT = arg('--limit') ? Number(arg('--limit')) : Infinity;
const FROM_ID = arg('--from-id') ? Number(arg('--from-id')) : 0;

const LABELS: Record<string, string> = {
  LINKED_BY_ID: 'Já estavam ligadas pelo ID do DentalGO (só completou campos vazios)',
  LINKED_BY_ALIAS: 'Já estavam ligadas pelo registro de origem DENTALGO',
  WOULD_LINK: 'LIGADAS a uma ficha existente (e-mail igual + nome compatível, sem conflito)',
  WOULD_JOIN_PROVISIONAL: 'Entraram numa ficha provisória que já estava em revisão',
  REVIEW: 'Ficha própria + REVISÃO (até alguém decidir)',
  NEW: 'FICHA NOVA',
};

const summary = emptySyncSummary();
let interrupted = false;

async function main() {
  if (!APPLY) {
    throw new Error('Este script GRAVA. Para ver o que aconteceria, rode prisma/simulate-dentalgo-sync.ts. Para gravar: --apply (de preferência com --limit 500 primeiro).');
  }
  if (!Number.isFinite(FROM_ID) || FROM_ID < 0 || (LIMIT !== Infinity && !(LIMIT > 0))) {
    throw new Error('--from-id e --limit precisam ser números positivos.');
  }

  // Lista fixa durante toda a gravação: sem ela um número genérico juntaria milhares de revisões
  const generic = await requireGenericPhones();
  setGenericPhonesProvider(async () => generic);
  console.log(`Telefones genéricos ignorados: ${generic.size}`);
  console.log(`Gravando a partir do DentalGO #${FROM_ID + 1}${LIMIT !== Infinity ? `, até ${LIMIT} contas` : ' até o fim'}. Ctrl+C para parar com segurança.\n`);

  const started = Date.now();
  await runDentalGoSync({
    fetchPage: async (afterId, take) => {
      const [rows]: any = await pool.query(
        `SELECT id, NULLIF(fullName, '') AS fullName, NULLIF(email, '') AS email,
                NULLIF(phoneNumber, '') AS phoneNumber, NULLIF(documentNumber, '') AS cpf
         FROM people WHERE admin = 0 AND id > ? ORDER BY id LIMIT ?`,
        [afterId, take],
      );
      return (rows as any[]).map(r => ({ ...r, id: Number(r.id) }));
    },
    inspect: r => CanonicalIdentityService.inspectDentalGoPerson(r.id, r),
    resolve: r => CanonicalIdentityService.resolveDentalGoPerson(r.id, r),
    shouldStop: () => interrupted,
    onProgress: s => process.stdout.write(`  ${s.processed} contas gravadas — até #${s.lastId} (${Math.round((Date.now() - started) / 1000)}s)\r`),
  }, { fromId: FROM_ID, limit: LIMIT }, summary);
}

async function report() {
  if (!APPLY) return;
  const s = summary;
  console.log(`\n\n═══ Ligação da base do DentalGO ao CRM — GRAVADO ═══`);
  console.log(`Contas processadas: ${s.processed}${s.firstId !== null ? ` (DentalGO #${s.firstId} a #${s.lastId})` : ''}\n`);
  for (const k of Object.keys(LABELS)) console.log(`  ${String(s.outcomes[k as keyof typeof s.outcomes]).padStart(6)}  ${LABELS[k]}`);
  const reasons = Object.entries(s.reviewReasons).sort((a, b) => b[1] - a[1]);
  if (reasons.length) {
    console.log('\nMotivos das revisões:');
    for (const [reason, n] of reasons) console.log(`  ${String(n).padStart(6)}  ${reason}`);
  }
  console.log(`\nDivergências (ficha gravada diferente da prevista): ${s.mismatchCount}${s.mismatches.length ? ` — ${s.mismatches.join(', ')}` : ''}`);
  console.log(`Erros: ${s.errorCount}`);
  for (const e of s.errors) console.log(`  #${e.id}: ${e.message}`);
  if (s.aborted) console.log(`\n⚠ ${s.aborted}`);
  if (interrupted) console.log('\n⚠ Interrompido com Ctrl+C.');
  if (s.processed) {
    console.log(`\nPara continuar: --apply --from-id ${s.resumeFromId}`);
    await prisma.domainEvent.create({
      data: {
        type: 'IDENTITY_DENTALGO_SYNC',
        actorType: 'SYSTEM',
        metadata: JSON.parse(JSON.stringify({ fromId: FROM_ID, limit: LIMIT === Infinity ? null : LIMIT, interrupted, ...s })),
      },
    });
  }
}

process.on('SIGINT', () => {
  if (interrupted) process.exit(130);
  interrupted = true;
  console.log('\n  Parando depois da conta atual... (Ctrl+C de novo força a saída)');
});

main()
  .catch(err => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await report(); } catch (e: any) { console.error('Falha ao registrar a execução:', e?.message ?? e); }
    if (summary.errorCount || summary.mismatchCount || summary.aborted) process.exitCode = 1;
    await prisma.$disconnect();
    await pool.end();
  });
