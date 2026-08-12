import { PrismaClient } from '@prisma/client';
import pool from '../src/lib/db';
import { CustomerCreationService } from '../src/lib/application/CustomerCreationService';

const prisma = new PrismaClient();

async function runDirectSync() {
  console.log('[DirectSync] Iniciando sincronização em lote de clientes...');

  try {
    // 1. Garantir que as pipelines padrão existem no Postgres
    const defaultPipelines = ['Vendas', 'CS', 'Nutrição'];
    const pipelineMap = new Map<string, string>();

    for (const name of defaultPipelines) {
      const p = await prisma.pipeline.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      pipelineMap.set(name, p.id);
    }

    const vendasPipelineId = pipelineMap.get('Vendas');

    // 2. Tentar buscar dados via API existente (HTTP) ou fallback direto no MySQL
    let abandonedLeads: any[] = [];
    let expiringLeads: any[] = [];

    const baseUrl = 'http://localhost:3000';
    const month = new Date().toISOString().slice(0, 7);

    // A. Buscar Carrinhos Abandonados (Orphans)
    try {
      console.log(`[DirectSync] Buscando carrinhos abandonados via query direta no MySQL...`);
      const query = `
        SELECT
          p.id AS personId,
          p.fullName,
          p.email,
          p.phoneNumber,
          p.createdAt AS registeredAt
        FROM people p
        WHERE p.admin = 0
          AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.personId = p.id)
          AND NOT EXISTS (SELECT 1 FROM purchases pu WHERE pu.personId = p.id)
          AND (p.fullName IS NOT NULL AND p.fullName != '' AND p.fullName NOT LIKE '%bot%' AND p.email NOT LIKE '%bot%')
        ORDER BY p.createdAt DESC
        LIMIT 1000
      `;
      const [rows] = await pool.query(query);
      abandonedLeads = (rows as any[]).map(r => ({
        personId: r.personId,
        fullName: r.fullName,
        email: r.email,
        phoneNumber: r.phoneNumber,
        registeredAt: r.registeredAt,
      }));
    } catch (err) {
      console.error('[DirectSync] Erro na query de abandonados:', err);
    }

    // B. Buscar Assinaturas Expirando
    try {
      console.log(`[DirectSync] Buscando assinaturas expirando via query direta no MySQL...`);
      const query = `
        SELECT
          p.id AS personId,
          p.fullName,
          p.email,
          p.phoneNumber,
          pl.title AS planTitle,
          s.isValidUntil AS expirationDate,
          DATEDIFF(s.isValidUntil, CURDATE()) AS daysLeft
        FROM subscriptions s
        JOIN people p ON s.personId = p.id
        JOIN plans pl ON s.planId = pl.id
        WHERE s.status = 'active'
          AND pl.price >= 2000
          AND s.isValidUntil IS NOT NULL
          AND s.isValidUntil >= CURDATE()
          AND s.isValidUntil <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
        ORDER BY s.isValidUntil ASC
        LIMIT 1000
      `;
      const [rows] = await pool.query(query);
      expiringLeads = (rows as any[]).map(r => ({
        personId: r.personId,
        fullName: r.fullName,
        email: r.email,
        phoneNumber: r.phoneNumber,
        planTitle: r.planTitle,
        expirationDate: r.expirationDate,
      }));
    } catch (err) {
      console.error('[DirectSync] Erro na query de expirados:', err);
    }

    console.log(`[DirectSync] Obtidos ${abandonedLeads.length} abandonos e ${expiringLeads.length} expirações do MySQL.`);

    // 3. Upsert de Carrinhos Abandonados no Postgres
    let abandonedCount = 0;
    for (const lead of abandonedLeads) {
      const externalPersonId = Number(lead.personId);
      if (!externalPersonId || isNaN(externalPersonId)) continue;

      const metadata = {
        fullName: lead.fullName || 'Sem Nome',
        email: lead.email || '',
        phoneNumber: lead.phoneNumber || '',
        registeredAt: lead.registeredAt || new Date().toISOString(),
        type: 'ABANDONED_CART',
      };

      await CustomerCreationService.createOrMerge({
        externalPersonId,
        tag: 'ABANDONED_CART',
        pipelineId: vendasPipelineId,
        metadata,
        source: 'API Sync (Cart)'
      });
      abandonedCount++;
    }

    // 4. Upsert de Assinaturas Expirando no Postgres
    let expiringCount = 0;
    for (const lead of expiringLeads) {
      const externalPersonId = Number(lead.personId);
      if (!externalPersonId || isNaN(externalPersonId)) continue;

      const metadata = {
        fullName: lead.fullName || 'Sem Nome',
        email: lead.email || '',
        phoneNumber: lead.phoneNumber || '',
        planTitle: lead.planTitle || 'Plano Core',
        expirationDate: lead.expirationDate || null,
        type: 'EXPIRING_SUBSCRIPTION',
      };

      await CustomerCreationService.createOrMerge({
        externalPersonId,
        tag: 'CANCELED_CLIENT',
        pipelineId: vendasPipelineId,
        metadata,
        source: 'API Sync (Expiring)'
      });
      expiringCount++;
    }

    console.log(`[DirectSync] Sincronização finalizada. Upserted ${abandonedCount} abandonos e ${expiringCount} expirações.`);
  } catch (error: any) {
    console.error('[DirectSync] Erro crítico durante a sincronização:', error);
  }
}

runDirectSync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
