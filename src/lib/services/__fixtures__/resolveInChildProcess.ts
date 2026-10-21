// Processo filho do teste de concorrência entre processos (CanonicalIdentityService.leak.spec.ts).
// Espera o instante combinado e chama resolve() — vários processos fazem isso ao mesmo tempo.
import prisma from '../../prisma';
import { CanonicalIdentityService } from '../CanonicalIdentityService';

async function main() {
  const [startAt, externalId, email, name] = process.argv.slice(2);
  const wait = Number(startAt) - Date.now();
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  const person = await CanonicalIdentityService.resolve({ source: 'LEAK_TEST', externalId, email, name });
  process.stdout.write(`\n${person.id}`); // última linha = ID (o serviço também loga no stdout)
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
