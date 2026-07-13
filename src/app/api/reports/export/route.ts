import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

const P_ANNUAL = "LOWER(pl.title) LIKE '%anual%'";
const P_RECURRING = "LOWER(pl.title) LIKE '%recorrente%' OR LOWER(pl.title) LIKE '%mensal%' OR (LOWER(pl.title) LIKE '%dentalgo%' AND LOWER(pl.title) NOT LIKE '%anual%')";
const P_INSTITUTIONAL = "LOWER(pl.title) LIKE '%scholar%' OR LOWER(pl.title) LIKE '%mandic%' OR LOWER(pl.title) LIKE '%ioa%' OR LOWER(pl.title) LIKE '%sbti%' OR LOWER(pl.title) LIKE '%sobrap%' OR LOWER(pl.title) LIKE '%sociedade%' OR LOWER(pl.title) LIKE '%universidade%' OR LOWER(pl.title) LIKE '%grupo%'";
const P_CORE = `(${P_ANNUAL} OR ${P_RECURRING}) AND pl.price >= 2000 AND NOT (${P_INSTITUTIONAL})`;

// Retroactive active filter helper
const PT_CORE_ACTIVE = (targetDate: string) => `
  s.status = 'active'
  AND s.createdAt <= LAST_DAY(CONCAT('${targetDate}', '-01'))
`;

export async function GET(request: Request) {
  try {
    // 1. Authenticate and authorize role
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (role !== 'ADMIN') {
      return new Response('Acesso negado: apenas administradores podem exportar relatórios.', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'general'; // general | monthly | financial
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM

    // 2. Generate CSV based on type
    if (type === 'general') {
      // General report: all people + subscription + CRM stage
      const query = `
        SELECT 
          p.id, 
          p.fullName, 
          p.email, 
          p.phoneNumber, 
          p.createdAt,
          pl.title as planTitle,
          pl.price as planPrice
        FROM people p
        LEFT JOIN subscriptions s ON s.personId = p.id AND s.status = 'active'
        LEFT JOIN plans pl ON s.planId = pl.id
        ORDER BY p.createdAt DESC
      `;
      const [rows] = await pool.query(query);
      const people = rows as any[];

      // Fetch CRM stages from Postgres
      const customers = await prisma.customer.findMany({
        include: { assignee: { select: { name: true } } }
      });
      const stateMap = new Map();
      customers.forEach(c => stateMap.set(c.externalPersonId, c));

      const csvHeaders = "ID,Nome Completo,Email,Telefone,Data Cadastro,Plano,Preco,Estagio CRM,Responsavel CRM\n";
      const csvRows = people.map(p => {
        const state = stateMap.get(p.id);
        const name = (p.fullName || 'Sem Nome').replace(/"/g, '""');
        const email = p.email || '';
        const phone = p.phoneNumber || '';
        const regDate = p.createdAt.toISOString().slice(0, 10);
        const plan = p.planTitle ? p.planTitle.replace(/"/g, '""') : 'Cadastro Grátis';
        const price = p.planPrice ? (p.planPrice / 100).toFixed(2) : '0.00';
        const stage = state?.stage || 'novo_cadastro';
        const agent = state?.assignee?.name || 'Não atribuído';

        return `"${p.id}","${name}","${email}","${phone}","${regDate}","${plan}","${price}","${stage}","${agent}"`;
      }).join('\n');

      return new Response(csvHeaders + csvRows, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=relatorio_geral_plataforma_${month}.csv`
        }
      });

    } else if (type === 'monthly') {
      // Monthly report: key metric details for selected month
      // Let's get KPIs from core db
      const qKpis = `
        SELECT 
          (SELECT COUNT(*) FROM people WHERE DATE_FORMAT(createdAt, '%Y-%m') = ?) as acquisitions,
          (SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND createdAt <= LAST_DAY(CONCAT(?, '-01'))) as activeSubscriptions,
          (SELECT COUNT(*) FROM subscriptions WHERE status = 'canceled' AND DATE_FORMAT(canceledAt, '%Y-%m') = ?) as churnCount,
          (SELECT COALESCE(SUM(total), 0) FROM purchases WHERE status = 'success' AND DATE_FORMAT(createdAt, '%Y-%m') = ?) as looseSales
      `;
      const [kpiRows] = await pool.query(qKpis, [month, month, month, month]);
      const kpis = (kpiRows as any[])[0] || {};

      // Get CRM states counts from Postgres
      const stageCounts = await prisma.customer.groupBy({
        by: ['stage'],
        _count: true
      });
      const crmStagesSummary = stageCounts.map(sc => `${sc.stage}: ${sc._count}`).join(' | ');

      const csvHeaders = "Metrica,Valor,Detalhes\n";
      const csvRows = [
        `"Novas Aquisicoes (Cadastros)","${kpis.acquisitions || 0}","Clientes registrados em ${month}"`,
        `"Assinaturas Ativas Totais","${kpis.activeSubscriptions || 0}","Total acumulado ativo"`,
        `"Cancelamentos (Churn) no Mes","${kpis.churnCount || 0}","Planos cancelados em ${month}"`,
        `"Vendas Avulsas (Receita)","R$ ${((kpis.looseSales || 0) / 100).toFixed(2)}","Dinheiro novo em caixa avulso"`,
        `"Distribuicao Estagios CRM","${crmStagesSummary || 'Nenhum lead no funil'}","Estagios ativos no CRM comercial PostgreSQL"`
      ].join('\n');

      return new Response(csvHeaders + csvRows, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=relatorio_mensal_${month}.csv`
        }
      });

    } else if (type === 'financial') {
      // Financial report: separating annuals from recurring
      // 1. Query all plans and subscription counts/revenue
      const query = `
        SELECT 
          pl.id, 
          pl.title as planTitle, 
          pl.price as planPrice, 
          pl.intervalType, 
          COUNT(s.id) as activeCount,
          SUM(pl.price) as totalMonthlyRevenueCents
        FROM subscriptions s 
        JOIN plans pl ON s.planId = pl.id 
        WHERE (${PT_CORE_ACTIVE(month)}) AND (${P_CORE})
        GROUP BY pl.id, pl.title, pl.price, pl.intervalType
        ORDER BY activeCount DESC
      `;
      const [rows] = await pool.query(query);
      const plans = rows as any[];

      const csvHeaders = "ID Plano,Nome do Plano,Intervalo,Quantidade Ativos,Preco Plano (R$),Receita Total (R$),Tipo de Plano (Fidelidade)\n";
      let totalAnnualCents = 0;
      let totalRecurringCents = 0;
      let totalAnnualCount = 0;
      let totalRecurringCount = 0;

      const csvRows = plans.map(p => {
        const isAnnual = p.planTitle.toLowerCase().includes('anual');
        const priceBrl = (p.planPrice / 100).toFixed(2);
        const totalBrl = ((p.planPrice * p.activeCount) / 100).toFixed(2);
        const classification = isAnnual ? "Fidelidade Anual" : "Mensal Recorrente";

        if (isAnnual) {
          totalAnnualCents += p.planPrice * p.activeCount;
          totalAnnualCount += p.activeCount;
        } else {
          totalRecurringCents += p.planPrice * p.activeCount;
          totalRecurringCount += p.activeCount;
        }

        return `"${p.id}","${p.planTitle.replace(/"/g, '""')}","${p.intervalType}","${p.activeCount}","${priceBrl}","${totalBrl}","${classification}"`;
      });

      // Append summary lines
      csvRows.push("");
      csvRows.push(`"","Resumo consolidado de Faturamento","","","","",""`);
      csvRows.push(`"","Total Planos Anuais (Fidelidade)","","${totalAnnualCount}","","R$ ${(totalAnnualCents / 100).toFixed(2)}",""`);
      csvRows.push(`"","Total Planos Mensais/Recorrentes","","${totalRecurringCount}","","R$ ${(totalRecurringCents / 100).toFixed(2)}",""`);
      csvRows.push(`"","Faturamento Total Estimado (MRR Core)","","${totalAnnualCount + totalRecurringCount}","","R$ ${((totalAnnualCents + totalRecurringCents) / 100).toFixed(2)}",""`);

      return new Response(csvHeaders + csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=relatorio_financeiro_${month}.csv`
        }
      });
    }

    return new Response('Relatório inválido.', { status: 400 });
  } catch (error: any) {
    console.error('Export error:', error);
    return new Response(`Erro ao exportar relatório: ${error.message}`, { status: 500 });
  }
}
