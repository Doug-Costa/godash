'use client';

import { useState, useEffect } from 'react';
import KpiCard from '@/components/ui/KpiCard';
import GrowthTrendChart from '@/components/charts/GrowthTrendChart';
import ChurnChart from '@/components/charts/ChurnChart';
import PlanDistributionChart from '@/components/charts/PlanDistributionChart';
import CohortTable from '@/components/charts/CohortTable';
import ExpiringTable from '@/components/charts/ExpiringTable';
import ThemeToggle from '@/components/ThemeToggle';
import PlanSelector from '@/components/ui/PlanSelector';
import MonthSelector from '@/components/ui/MonthSelector';

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface DashboardContentProps {
  kpis: Record<string, any> | null;
  revenue: Record<string, any> | null;
  users: Record<string, any> | null;
  churn: Record<string, any> | null;
  subscriptions: Record<string, any> | null;
  period: string;
  month: string;
}

export default function DashboardContent({ kpis, revenue, users, churn, subscriptions, period, month }: DashboardContentProps) {
  const [selectedPlan, setSelectedPlan] = useState('all');

  const now = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const monthLabel = month ? new Date(month + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '';

  return (
    <div style={{ minHeight: '100vh', padding: '24px 24px 64px' }}>
      {/* Header */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 32, flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.03em',
          }}>
            <span style={{ color: 'var(--accent)' }}>Dental</span>GO
            <span style={{ color: 'var(--text-faint)', fontWeight: 400, marginLeft: 8 }}>BI</span>
          </h1>
          <p className="label-sm" style={{ marginTop: 4 }}>
            Última atualização: {now} | <span style={{ color: 'var(--accent)' }}>{monthLabel} (Competência)</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <PlanSelector selectedPlan={selectedPlan} />
          <ThemeToggle />
        </div>
      </header>

      {/* Month Selector */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="label-sm">Navegar no tempo:</span>
          <MonthSelector currentMonth={month} />
        </div>
      </div>

      {/* Linha 1: Strategic KPI Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        <KpiCard 
          title="Yield Core (MRR)" 
          value={kpis ? formatBRL(Number(kpis.mrrYield)) : '—'} 
          accent="green" delay={0} 
          subtitle="Receita de Competência Estimada"
        />
        <KpiCard 
          title="Vendas Avulsas (Mes)" 
          value={kpis ? formatBRL(Number(kpis.looseSales)) : '—'} 
          accent="yellow" delay={80} 
          subtitle="Dinheiro novo em caixa"
        />
        <KpiCard 
          title="Novos Assinantes" 
          value={kpis ? Number(kpis.newSubscribers).toString() : '—'} 
          accent="cyan" delay={160} 
          subtitle="Novas aquisições no mês"
        />
        <KpiCard 
          title="Base Core Ativa" 
          value={kpis ? Number(kpis.activeCoreCount).toLocaleString('pt-BR') : '—'} 
          accent="purple" delay={240} 
          subtitle="Usuários pagantes totais"
        />
      </div>

      {/* Linha 2: Growth Trend (Acquisition vs Churn) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <GrowthTrendChart 
          data={(revenue?.revenueByPeriod || []) as any[]} 
          month={month}
        />
        
        <PlanDistributionChart
          data={(users?.usersByPlan as any[]) || []}
          payingUsers={Number(kpis?.activeCoreCount) || 0}
          courtesyUsers={Number(users?.institutionalUsers) || 0}
        />
      </div>

      {/* Linha 3: Churn Detail + Top Origins (Placeholder for now) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <ChurnChart data={(churn?.churn as any[]) ?? []} />

        <div className="card animate-fadeUp" style={{ animationDelay: '350ms' }}>
          <div className="label" style={{ marginBottom: 20 }}>Top Performers (Planos)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {((users?.usersByPlan || []) as any[]).slice(0, 5).map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="label-sm" style={{ color: 'var(--text-primary)', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.title}
                </span>
                <span className="stat-mono" style={{ color: 'var(--accent)' }}>{p.count} users</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Linha 4: Cohort & Expiring */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}>
        <CohortTable data={(churn?.cohort as any[]) ?? []} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="label" style={{ color: 'var(--text-primary)', marginBottom: 12 }}>Assinaturas Core Próximas ao Vencimento</div>
        <ExpiringTable data={(subscriptions?.expiringSoon as any[]) ?? []} />
      </div>
    </div>
  );
}
