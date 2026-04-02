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

      {/* Linha 1: Strategic KPI Cards (Board View) */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        <KpiCard 
          title="Fator de Competência (Fidedigno)" 
          value={kpis ? formatBRL(Number(kpis.mrrFidedigno)) : '—'} 
          accent="green" delay={0} 
          subtitle="Pagamentos Reais (Últimos 45 dias)"
        />
        <KpiCard 
          title="Fator de Competência (Baixa Fidelidade)" 
          value={kpis ? formatBRL(Number(kpis.mrrEstimado)) : '—'} 
          accent="yellow" delay={80} 
          subtitle="Valor Estimado (Inclui 535 'Fantasmas')"
        />
        <KpiCard 
          title="Vendas Avulsas (Mês)" 
          value={kpis ? formatBRL(Number(kpis.looseSales)) : '—'} 
          accent="cyan" delay={160} 
          subtitle="Dinheiro Novo em Caixa"
        />
        <KpiCard 
          title="Base Core Ativa (Fidelidade)" 
          value={kpis ? Number(kpis.activeCoreCount).toLocaleString('pt-BR') : '—'} 
          accent="purple" delay={240} 
          subtitle="Usuários Pagantes Reais"
        />
      </div>

      {/* Linha 2-3: Growth Trend + Plan Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <GrowthTrendChart 
          data={(revenue?.revenueByPeriod || []) as any[]} 
          month={month}
        />
        
        <PlanDistributionChart
          data={(users?.usersByPlan as any[]) || []}
          payingUsers={Number(kpis?.activeCoreCount) || 0}
          courtesyUsers={Number(kpis?.categories?.cortesia) || 0}
        />
      </div>

      {/* Linha 4: Churn Detail + Top Performers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <ChurnChart data={(churn?.churn as any[]) ?? []} />

        <div className="card animate-fadeUp" style={{ animationDelay: '350ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="label">Top Performers (Planos Reais)</div>
            <button className="label-sm" style={{ cursor: 'pointer', color: 'var(--accent)', background: 'none', border: 'none' }}>Ver todos</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {((users?.usersByPlan || []) as any[]).slice(0, 6).map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%' }}>
                  <span className="label-sm" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.planTitle}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{formatBRL(p.price)} / {p.intervalType}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="stat-mono" style={{ color: 'var(--accent)', fontSize: 14 }}>{p.subscriberCount}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>usuários</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Linha 5: Cohort & Expiring */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}>
        <CohortTable data={(churn?.cohort as any[]) ?? []} />
      </div>


      {/* ÁREA COMERCIAL INTEGRADA: Rodapé de Ações */}
      <div className="card animate-fadeUp" style={{ 
        padding: '32px', 
        border: '1px solid var(--accent-light)', 
        background: 'linear-gradient(rgba(var(--accent-rgb), 0.05), transparent)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>🚀 Central de Missões Comerciais</h3>
            <p className="label-sm" style={{ maxWidth: 500 }}>Base de inteligência para o time de vendas agir na recuperação de "Ghosts", renovações antecipadas e carrinhos abandonados.</p>
          </div>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a 
              href={`/api/commercial/extract?type=recovery&format=csv&month=${month}`}
              className="btn-action btn-action-red"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.5-1 1-4c1.5 0 3 .5 3 .5L9 12z"/><path d="M15 15v5c-3 1.5-4 1-4 1l-3-3h5z"/></svg>
              Recuperação (Churn)
            </a>
            <a 
              href={`/api/commercial/extract?type=expiring&format=csv&month=${month}`}
              className="btn-action btn-action-outline"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Renovações (60D)
            </a>
            <a 
              href={`/api/commercial/extract?type=abandoned&format=csv&month=${month}`}
              className="btn-action btn-action-purple"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              Carrinhos (Leads)
            </a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div className="card" style={{ padding: '20px', background: 'rgba(255, 71, 87, 0.05)', border: '1px solid rgba(255, 71, 87, 0.1)', textAlign: 'center' }}>
            <div className="label-sm" style={{ color: 'var(--red)', fontWeight: 600, marginBottom: 8 }}>Potencial de Recuperação Hoje</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--red)', letterSpacing: '-0.02em' }}>
              {kpis ? formatBRL(Number(kpis.mrrEstimado) - Number(kpis.mrrFidedigno)) : '—'}
            </div>
          </div>
          
          <div className="card" style={{ padding: '20px', background: 'rgba(111, 102, 241, 0.05)', border: '1px solid rgba(111, 102, 241, 0.1)', textAlign: 'center' }}>
            <div className="label-sm" style={{ color: 'var(--purple)', fontWeight: 600, marginBottom: 8 }}>Leads Reais em Carrinhos</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--purple)', letterSpacing: '-0.02em' }}>
              {users ? users.abandonedLeads.length : '—'}
            </div>
          </div>

          <div className="card" style={{ padding: '20px', background: 'var(--surface-raised)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div className="label-sm" style={{ color: 'var(--text-faint)', fontWeight: 600, marginBottom: 8 }}>Bots Bloqueados no Período</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-faint)', letterSpacing: '-0.02em' }}>
              {users ? users.botCount : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
