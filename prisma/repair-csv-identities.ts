import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { CanonicalIdentityService } from '../src/lib/services/CanonicalIdentityService';

const apply = process.argv.includes('--apply');
const sourceArg = process.argv.find((arg) => arg.startsWith('--source='));
const source = sourceArg?.slice('--source='.length) || 'CSV_IMPORT';

function value(raw: Record<string, unknown>, ...names: string[]): string | null {
  const entries = Object.entries(raw);
  for (const name of names) {
    const found = entries.find(([key]) => key.trim().toLowerCase() === name.toLowerCase());
    const result = found?.[1]?.toString().trim();
    if (result) return result;
  }
  return null;
}

function fields(rawValue: unknown) {
  const raw = rawValue && typeof rawValue === 'object' ? rawValue as Record<string, unknown> : {};
  const client = value(raw, 'Cliente', 'Aluno');
  const parts = client?.includes('/') ? client.split('/') : [];
  const name = parts.length > 1 ? parts.slice(1).join('/').trim() : value(raw, 'name', 'nome', 'full_name');
  const emailCandidate = value(raw, 'email', 'EMAIL_FISCAL', 'E-mail');
  const email = emailCandidate?.includes('@') ? emailCandidate.split(';')[0].trim() : null;
  const phone = ['phone', 'telefone', 'Telefone Comercial', 'Telefone Residencial', 'whatsapp', 'Celular']
    .map((field) => value(raw, field))
    .find((candidate) => {
      const digits = candidate?.replace(/\D/g, '') || '';
      return digits.length >= 8 && !/^0+$/.test(digits) && digits !== '55555555555';
    }) || null;
  return { name, email, phone };
}

async function main() {
  const aliases = await prisma.identityAlias.findMany({
    where: { source },
    include: { person: true },
    orderBy: { createdAt: 'asc' }
  });

  const result = { source, scanned: aliases.length, enrichable: 0, relinkable: 0, unchanged: 0, conflicts: [] as unknown[], apply };

  for (const alias of aliases) {
    const incoming = fields(alias.rawData);
    const personUpdates: { fullName?: string; email?: string; phoneNumber?: string } = {};
    if (CanonicalIdentityService.isPlaceholderName(alias.person.fullName) && incoming.name && !CanonicalIdentityService.isPlaceholderName(incoming.name)) personUpdates.fullName = incoming.name;
    if (!alias.person.email && incoming.email) personUpdates.email = CanonicalIdentityService.normalizeEmail(incoming.email) || undefined;
    if (!alias.person.phoneNumber && incoming.phone) personUpdates.phoneNumber = CanonicalIdentityService.normalizePhone(incoming.phone) || undefined;

    const externalPersonId = /^\d+$/.test(alias.externalId) ? Number(alias.externalId) : null;
    const customers = externalPersonId === null ? [] : await prisma.customer.findMany({
      where: { externalPersonId },
      include: { person: true }
    });
    const relink = customers.filter((customer) => customer.personId !== alias.personId).filter((customer) => {
      const oldEmail = CanonicalIdentityService.normalizeEmail(customer.person?.email);
      const newEmail = CanonicalIdentityService.normalizeEmail(incoming.email);
      const oldPhone = CanonicalIdentityService.normalizePhone(customer.person?.phoneNumber);
      const newPhone = CanonicalIdentityService.normalizePhone(incoming.phone);
      const hasConflict = Boolean((oldEmail && newEmail && oldEmail !== newEmail) || (oldPhone && newPhone && oldPhone !== newPhone));
      if (hasConflict) {
        result.conflicts.push({ externalPersonId, customerId: customer.id, reason: 'IDENTIDADE_EXISTENTE_DIVERGENTE' });
      }
      return !hasConflict;
    });

    if (Object.keys(personUpdates).length === 0 && relink.length === 0) {
      result.unchanged++;
      continue;
    }
    if (Object.keys(personUpdates).length > 0) result.enrichable++;
    result.relinkable += relink.length;

    if (apply) {
      await prisma.$transaction([
        ...(Object.keys(personUpdates).length > 0
          ? [prisma.person.update({ where: { id: alias.personId }, data: personUpdates })]
          : []),
        ...relink.map((customer) => prisma.customer.update({ where: { id: customer.id }, data: { personId: alias.personId } }))
      ]);
    }
  }

  console.log(JSON.stringify(result, null, 2));
  if (!apply) console.log('\nPREVIEW concluído. Execute novamente com --apply para efetivar os casos seguros.');
}

main().finally(() => prisma.$disconnect());
