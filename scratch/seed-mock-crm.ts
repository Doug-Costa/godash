import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[SeedMockCrm] Starting mock database seed...');

  // 1. Seed Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dentalgo.com' },
    update: {},
    create: {
      name: 'Administrador DentalGO',
      email: 'admin@dentalgo.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    }
  });
  console.log('[SeedMockCrm] Admin user verified:', admin.email);

  // 2. Seed Default Pipelines
  const defaultPipelines = ['Vendas', 'CS', 'Nutrição'];
  const pipelineMap = new Map<string, string>();
  for (const name of defaultPipelines) {
    const p = await prisma.pipeline.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `Funil padrão de ${name}`
      }
    });
    pipelineMap.set(name, p.id);
  }
  console.log('[SeedMockCrm] Default pipelines verified');

  // 3. Seed Canonical Person
  const person = await prisma.person.create({
    data: {
      externalPersonId: 999,
      fullName: 'Guilherme Silva',
      email: 'guilherme@example.com',
      phoneNumber: '+5511988888888',
      source: 'DENTALGO',
      identityAliases: {
        create: {
          source: 'DENTALGO',
          externalId: '999',
          email: 'guilherme@example.com',
          phone: '+5511988888888',
          name: 'Guilherme Silva',
          rawData: {}
        }
      }
    }
  });
  console.log('[SeedMockCrm] Canonical Person created:', person.id);

  // 4. Seed Customer Context (linked to Person)
  const customer = await prisma.customer.create({
    data: {
      personId: person.id,
      externalPersonId: 999,
      source: 'DENTALGO',
      stage: 'novo_cadastro',
      pipelineId: pipelineMap.get('Vendas'),
      metadata: {}
    }
  });
  console.log('[SeedMockCrm] Customer context created:', customer.id);

  console.log('[SeedMockCrm] Mock database seed completed successfully!');
}

main()
  .catch(e => {
    console.error('[SeedMockCrm] Error during seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
