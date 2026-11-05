/**
 * simulate-dentalgo-sync.ts — SIMULAÇÃO (só leitura) da ligação da base do DentalGO às fichas do CRM.
 *
 * Para cada pessoa do DentalGO (MySQL `people`, sem administradores), diz o que a sincronização
 * faria, usando as mesmas regras da gravação (CanonicalIdentityService.inspectDentalGoPerson):
 *   já ligada pelo ID · já ligada pelo registro de origem · seria ligada a uma ficha existente ·
 *   entraria numa ficha provisória em revisão · iria para revisão · geraria ficha nova.
 * Não grava nada, nem no CRM nem no DentalGO. Mostra só contagens e IDs do DentalGO.
 *
 * Uso:
 *   docker exec -it dentalgo-bi npx tsx prisma/simulate-dentalgo-sync.ts             # base inteira
 *   docker exec -it dentalgo-bi npx tsx prisma/simulate-dentalgo-sync.ts --limit 2000
 *   docker exec -it dentalgo-bi npx tsx prisma/simulate-dentalgo-sync.ts --only 12345 # uma pessoa
 *
 * Atenção: a simulação compara cada pessoa com as fichas do CRM de AGORA. Na gravação, contas do
 * DentalGO que dividem e-mail/telefone entre si também serão comparadas umas com as outras —
 * por isso elas aparecem num total à parte.
 */
import prisma from '../src/lib/prisma';
import pool from '../src/lib/db';
import { CanonicalIdentityService } from '../src/lib/services/CanonicalIdentityService';
import { DentalGoSyncSimulation, type DentalGoPersonRow } from '../src/lib/identity/dentalGoSyncSimulation';

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const LIMIT = arg('--limit') ? Number(arg('--limit')) : Infinity;
const ONLY = arg('--only') ? Number(arg('--only')) : null;
const PAGE = 2000;

const SELECT = `SELECT id, NULLIF(fullName, '') AS fullName, NULLIF(email, '') AS email,
                       NULLIF(phoneNumber, '') AS phoneNumber, NULLIF(documentNumber, '') AS cpf
                FROM people`;

const inspect = (r: DentalGoPersonRow) => CanonicalIdentityService.inspectDentalGoPerson(r.id, r);

const LABELS: Record<string, string> = {
  LINKED_BY_ID: 'Já ligadas a uma ficha pelo ID do DentalGO',
  LINKED_BY_ALIAS: 'Já ligadas a uma ficha pelo registro de origem DENTALGO',
  WOULD_LINK: 'Seriam LIGADAS a uma ficha existente (e-mail igual + nome compatível, sem conflito)',
  WOULD_JOIN_PROVISIONAL: 'Entrariam numa ficha provisória que já está em revisão',
  REVIEW: 'Iriam para REVISÃO (ficha separada até alguém decidir)',
  NEW: 'Gerariam FICHA NOVA (ninguém no CRM com o mesmo contato)',
};

async function main() {
  if (ONLY !== null) {
    const [rows]: any = await pool.query(`${SELECT} WHERE id = ?`, [ONLY]);
    if (!rows[0]) throw new Error(`Pessoa ${ONLY} não encontrada no DentalGO.`);
    const r = await inspect(rows[0]);
    console.log(`DentalGO #${ONLY}: ${LABELS[r.outcome]}`);
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  const sim = new DentalGoSyncSimulation(inspect);
  let lastId = 0;
  const started = Date.now();
  while (sim.summary.total < LIMIT) {
    const take = Math.min(PAGE, LIMIT - sim.summary.total);
    const [rows]: any = await pool.query(`${SELECT} WHERE admin = 0 AND id > ? ORDER BY id LIMIT ?`, [lastId, take]);
    if (!rows.length) break;
    await sim.addBatch(rows.map((r: any) => ({ ...r, id: Number(r.id) })));
    lastId = Number(rows[rows.length - 1].id);
    process.stdout.write(`  ${sim.summary.total} pessoas analisadas (${Math.round((Date.now() - started) / 1000)}s)\r`);
  }
  const s = sim.finish();
  const pct = (n: number) => `${((100 * n) / Math.max(s.total, 1)).toFixed(1).padStart(5)}%`;
  const line = (n: number, label: string) => console.log(`  ${String(n).padStart(6)}  ${pct(n)}  ${label}`);

  console.log(`\n\n═══ Ligação da base do DentalGO ao CRM — SIMULAÇÃO (nada foi gravado) ═══`);
  console.log(`Pessoas do DentalGO analisadas: ${s.total}${s.errors ? ` (${s.errors} com erro na análise)` : ''}\n`);
  for (const k of Object.keys(LABELS)) line(s.outcomes[k as keyof typeof s.outcomes], LABELS[k]);

  console.log(`\nFichas novas: ${s.newByReason.NO_CANDIDATE} sem nenhum contato igual no CRM; ${s.newByReason.DISTINCT} com contato igual mas descartado pelas regras (ex.: telefone fictício)`);
  if (s.reviewReasons.size) {
    console.log('\nMotivos das revisões:');
    for (const [reason, n] of [...s.reviewReasons].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(6)}  ${reason}`);
  }
  console.log('\nPontos de atenção:');
  console.log(`  ${String(s.linkedToPersonWithOtherDentalGoId).padStart(6)}  ligariam a uma ficha que já tem OUTRO ID do DentalGO (duas contas da mesma pessoa?)`);
  console.log(`  ${String(s.crmPersonsReceivingSeveralAccounts).padStart(6)}  fichas do CRM receberiam 2 ou mais contas do DentalGO`);
  console.log(`  ${String(s.accountsSharingEmail).padStart(6)}  contas do DentalGO dividem o e-mail com outra conta do DentalGO`);
  console.log(`  ${String(s.accountsSharingPhone).padStart(6)}  contas do DentalGO dividem o telefone com outra conta do DentalGO`);
  console.log('  (na gravação, essas contas também serão comparadas entre si, pelas mesmas regras)');

  console.log('\nExemplos para conferir (IDs do DentalGO — use --only <id> para ver um caso):');
  for (const [k, ids] of s.samples) console.log(`  ${k.padEnd(24)} ${ids.join(', ')}`);
}

main()
  .catch(err => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
