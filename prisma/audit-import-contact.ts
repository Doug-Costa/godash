import 'dotenv/config';
import prisma from '../src/lib/prisma';

const searchArg = process.argv.find((arg) => arg.startsWith('--search='));
const search = searchArg?.slice('--search='.length).trim() || '';
if (!search) throw new Error('Informe --search="nome, e-mail ou ID".');

async function main() {
  const numericId = /^\d+$/.test(search) ? Number(search) : null;
  const aliases = await prisma.identityAlias.findMany({
    where: {
      OR: [
        { externalId: search },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { person: { fullName: { contains: search, mode: 'insensitive' } } },
        { person: { email: { contains: search, mode: 'insensitive' } } }
      ]
    },
    include: {
      person: {
        include: {
          customers: {
            include: {
              customerProducts: { include: { product: true }, orderBy: { startDate: 'asc' } },
              opportunities: { include: { product: true, pipeline: true } }
            }
          }
        }
      }
    }
  });

  const customersByLegacyId = numericId === null ? [] : await prisma.customer.findMany({
    where: { externalPersonId: numericId },
    include: { person: true, customerProducts: { include: { product: true } } }
  });

  console.log(JSON.stringify({ search, aliases, customersByLegacyId }, null, 2));
}

main().finally(() => prisma.$disconnect());
