/**
 * seed-persons.ts
 *
 * Script de migração de dados (roda uma única vez).
 * Cria registros Person a partir de Customer.metadata existentes,
 * resolvendo o problema "Lead #7509".
 *
 * Uso: npx tsx prisma/seed-persons.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10) return null;
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 11) {
    return `+55${digits}`;
  }
  return `+${digits}`;
}

function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const clean = raw.toLowerCase().trim();
  if (clean.length < 5 || !clean.includes('@')) return null;
  return clean;
}

async function main() {
  console.log('[SeedPersons] Iniciando migracao de identidade Customer -> Person...');

  const allCustomers = await prisma.customer.findMany({
    where: { personId: null as any },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`[SeedPersons] ${allCustomers.length} customers sem Person encontrados.`);

  const byExternalId = new Map<number, typeof allCustomers>();
  const withoutExternalId: typeof allCustomers = [];

  for (const c of allCustomers) {
    if (c.externalPersonId !== null) {
      const group = byExternalId.get(c.externalPersonId) || [];
      group.push(c);
      byExternalId.set(c.externalPersonId, group);
    } else {
      withoutExternalId.push(c);
    }
  }

  console.log(`[SeedPersons] ${byExternalId.size} grupos por externalPersonId`);
  console.log(`[SeedPersons] ${withoutExternalId.length} customers sem externalPersonId`);

  let createdCount = 0;
  let mergedCount = 0;
  let orphanCount = 0;

  // Processar grupos DentalGO (externalPersonId)
  for (const [extId, customers] of byExternalId.entries()) {
    const primary = customers[0];
    const meta = (primary.metadata as Record<string, any>) || {};

    const fullName = meta.fullName || meta.name || null;
    const email = normalizeEmail(meta.email);
    const phoneNumber = normalizePhone(meta.phoneNumber || meta.phone);

    const existing = await prisma.person.findFirst({
      where: { externalPersonId: extId }
    });

    let person: any;
    if (existing) {
      person = await prisma.person.update({
        where: { id: existing.id },
        data: {
          fullName: existing.fullName || fullName,
          email: existing.email || email,
          phoneNumber: existing.phoneNumber || phoneNumber,
        }
      });
      mergedCount++;
    } else {
      person = await prisma.person.create({
        data: {
          fullName,
          email,
          phoneNumber,
          source: primary.source || 'DENTALGO',
          externalPersonId: extId,
          identityAliases: {
            create: {
              source: 'DENTALGO',
              externalId: String(extId),
              email,
              phone: phoneNumber,
              name: fullName,
              rawData: meta as any
            }
          }
        }
      });
      createdCount++;
    }

    for (const c of customers) {
      await prisma.customer.update({
        where: { id: c.id },
        data: { personId: person.id }
      });
    }
  }

  // Processar leads sem externalPersonId
  for (const c of withoutExternalId) {
    const meta = (c.metadata as Record<string, any>) || {};
    const fullName = meta.fullName || meta.name || null;
    const email = normalizeEmail(meta.email);
    const phoneNumber = normalizePhone(meta.phoneNumber || meta.phone);

    let person: any = null;

    if (email) {
      person = await prisma.person.findFirst({ where: { email } });
    }
    if (!person && phoneNumber) {
      person = await prisma.person.findFirst({ where: { phoneNumber } });
    }

    if (person) {
      mergedCount++;
      await prisma.person.update({
        where: { id: person.id },
        data: {
          fullName: person.fullName || fullName,
          email: person.email || email,
          phoneNumber: person.phoneNumber || phoneNumber,
        }
      });
    } else {
      if (!fullName && !email && !phoneNumber) orphanCount++;

      person = await prisma.person.create({
        data: {
          fullName,
          email,
          phoneNumber,
          source: c.source || 'MANUAL',
          identityAliases: (email || phoneNumber || fullName) ? {
            create: {
              source: c.source || 'MANUAL',
              externalId: c.id,
              email,
              phone: phoneNumber,
              name: fullName,
              rawData: meta as any
            }
          } : undefined
        }
      });
      createdCount++;
    }

    await prisma.customer.update({
      where: { id: c.id },
      data: { personId: person.id }
    });
  }

  const totalPersons = await prisma.person.count();
  const withPerson = await prisma.customer.count({ where: { personId: { not: null as any } } });
  const withoutPerson = await prisma.customer.count({ where: { personId: null as any } });

  console.log('[SeedPersons] Migracao concluida!');
  console.log(`  Person criados:          ${createdCount}`);
  console.log(`  Person mesclados:        ${mergedCount}`);
  console.log(`  Person vazios (orphans): ${orphanCount}`);
  console.log(`  Total Person no banco:   ${totalPersons}`);
  console.log(`  Customers com Person:    ${withPerson}`);
  console.log(`  Customers sem Person:    ${withoutPerson}`);
}

main()
  .catch(e => {
    console.error('[SeedPersons] Erro durante migracao:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
