import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { ImportNormalizationService } from '../src/lib/services/ImportNormalizationService';

const apply = process.argv.includes('--apply');

function rawValue(rawValue: unknown, ...names: string[]): string | null {
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) return null;
  const entries = Object.entries(rawValue as Record<string, unknown>);
  for (const name of names) {
    const match = entries.find(([key]) => key.trim().toLowerCase() === name.toLowerCase());
    const value = match?.[1]?.toString().trim();
    if (value) return value.replace(/^CURSOS\s*\/\s*/i, '').trim();
  }
  return null;
}

async function main() {
  const blankProductIds = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Product" WHERE BTRIM(name) = ''
  `;
  const products = await prisma.product.findMany({
    where: { id: { in: blankProductIds.map((product) => product.id) } },
    include: {
      customerProducts: {
        include: {
          customer: {
            include: {
              person: {
                include: { identityAliases: { where: { source: 'CSV_IMPORT' } } }
              }
            }
          }
        }
      }
    }
  });

  const result = { scanned: products.length, recoverable: 0, ambiguous: 0, withoutEvidence: 0, repairs: [] as unknown[], apply };

  for (const product of products.filter((item) => !item.name.trim())) {
    const candidates = product.customerProducts.flatMap((purchase) =>
      purchase.customer.person?.identityAliases.flatMap((alias) => {
        const name = rawValue(alias.rawData, 'Curso', 'product_name', 'Produto', 'Descrição', 'Descricao');
        return name ? [name] : [];
      }) || []
    );
    const unique = new Map<string, string>();
    for (const candidate of candidates) {
      const key = ImportNormalizationService.normalizeString(candidate);
      if (key) unique.set(key, candidate);
    }

    if (unique.size === 1) {
      const recoveredName = [...unique.values()][0];
      result.recoverable++;
      result.repairs.push({ productId: product.id, name: recoveredName, evidenceRows: candidates.length });
      if (apply) await prisma.product.update({ where: { id: product.id }, data: { name: recoveredName } });
    } else if (unique.size > 1) {
      result.ambiguous++;
      result.repairs.push({ productId: product.id, reason: 'NOMES_DIVERGENTES', candidates: [...unique.values()] });
    } else {
      result.withoutEvidence++;
      result.repairs.push({ productId: product.id, reason: 'SEM_EVIDENCIA_NO_CSV' });
    }
  }

  console.log(JSON.stringify(result, null, 2));
  if (!apply) console.log('\nPREVIEW concluído. Use --apply somente após conferir os nomes recuperados.');
}

main().finally(() => prisma.$disconnect());
