/**
 * repair-empty-persons.ts — diagnostica e repara Persons sem nome, e-mail e telefone.
 * Regras em src/lib/identity/emptyPersonRepair.ts (só preenche campos vazios, nunca sobrescreve).
 *
 * Uso:
 *   npx tsx prisma/repair-empty-persons.ts                            # SIMULAÇÃO — diagnóstico, não grava nada
 *   npx tsx prisma/repair-empty-persons.ts --apply                    # completa as fichas que têm de onde puxar dados
 *   npx tsx prisma/repair-empty-persons.ts --apply --delete-orphans   # também remove as órfãs
 *   docker exec -it dentalgo-bi npx tsx prisma/repair-empty-persons.ts [--apply] [--delete-orphans]
 *
 * Órfã = sem nome/e-mail/telefone, sem registro de origem e sem cadastro. Só é removida com
 * --apply --delete-orphans; a condição é conferida de novo na hora e os IDs removidos ficam
 * registrados em DomainEvent (IDENTITY_EMPTY_ORPHANS_REMOVED).
 *
 * Depois do --apply, rode a auditoria de duplicatas: fichas que ganharam e-mail/telefone
 * podem revelar duplicatas que antes eram invisíveis.
 */
import { PrismaClient } from '@prisma/client';
import pool from '../src/lib/db';
import {
  applyEmptyPersonRepair,
  planEmptyPersonRepair,
  removeEmptyOrphans,
  type DentalGoPersonData,
  type EmptyPersonCategory,
} from '../src/lib/identity/emptyPersonRepair';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const DELETE_ORPHANS = process.argv.includes('--delete-orphans');

const LABELS: Record<EmptyPersonCategory, string> = {
  FILL_FROM_DENTALGO: 'O DentalGO tem os dados (pelo ID da ficha ou do cadastro) → completar',
  FILL_FROM_RECORDS: 'Dados no cadastro ou na oportunidade (envio de formulário) → completar',
  FILL_FROM_ALIAS: 'Dados num registro de origem → completar',
  DENTALGO_WITHOUT_DATA: 'Tem ID do DentalGO, mas o DentalGO não tem dados (ou a pessoa não existe lá)',
  NO_DATA_WITH_RECORDS: 'Sem dados em lugar nenhum, mas com cadastro ligado → inspeção manual',
  ORPHAN: 'Órfã: sem dados, sem registro de origem e sem cadastro → removida só com --delete-orphans',
};

async function lookup(ids: number[]): Promise<Map<number, DentalGoPersonData>> {
  const [rows]: any = await pool.query(
    `SELECT id, NULLIF(fullName, '') AS fullName, NULLIF(email, '') AS email,
            NULLIF(phoneNumber, '') AS phoneNumber, NULLIF(documentNumber, '') AS cpf
     FROM people WHERE id IN (?)`,
    [ids],
  );
  return new Map((rows as any[]).map(r => [Number(r.id), r]));
}

async function main() {
  if (DELETE_ORPHANS && !APPLY) {
    throw new Error('--delete-orphans só funciona junto com --apply. Rode primeiro a simulação, sem opções.');
  }

  const plan = await planEmptyPersonRepair(prisma, lookup);
  const count = <K extends string>(key: (i: typeof plan[number]) => K) =>
    [...plan.reduce((m, i) => m.set(key(i), (m.get(key(i)) || 0) + 1), new Map<K, number>())].sort((a, b) => b[1] - a[1]);

  console.log(`\n═══ Fichas sem nome, e-mail e telefone — ${APPLY ? 'GRAVANDO' : 'SIMULAÇÃO (nada será gravado)'} ═══`);
  console.log(`Total: ${plan.length}\n`);
  for (const [cat, n] of count(i => i.category)) console.log(`  ${String(n).padStart(6)}  ${LABELS[cat]}`);
  console.log('\nPor origem (source):');
  for (const [src, n] of count(i => i.source).slice(0, 10)) console.log(`  ${String(n).padStart(6)}  ${src}`);
  console.log('\nPor mês de criação:');
  for (const [month, n] of count(i => i.createdMonth).sort((a, b) => a[0].localeCompare(b[0]))) console.log(`  ${String(n).padStart(6)}  ${month}`);
  console.log(`\nFichas que ganhariam CPF: ${plan.filter(i => i.fill?.cpf).length}`);
  console.log(`Fichas que ganhariam o ID do DentalGO: ${plan.filter(i => i.fill?.externalPersonId).length}`);

  if (!APPLY) {
    console.log('\nSimulação concluída. Para completar as fichas: --apply. Para também remover as órfãs: --apply --delete-orphans.');
    return;
  }
  const changed = await applyEmptyPersonRepair(prisma, plan);
  console.log(`\n✔ ${changed} fichas completadas (só campos vazios).`);
  if (DELETE_ORPHANS) {
    const removed = await removeEmptyOrphans(prisma, plan, null);
    console.log(`✔ ${removed} fichas órfãs removidas (IDs registrados no evento IDENTITY_EMPTY_ORPHANS_REMOVED).`);
  } else {
    console.log('Nenhuma ficha foi apagada (use --apply --delete-orphans para remover as órfãs).');
  }
  console.log('Próximo passo: rode a auditoria de duplicatas — fichas completadas podem revelar duplicatas.');
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
