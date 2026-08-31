'use client';

import React, { useState, useEffect } from 'react';
import KpiCard from '@/components/ui/KpiCard';

interface KPIResponse {
  summary: {
    totalRevenue: number;
    activeProductsCount: number;
    totalSalesCount: number;
    averageTicket: number;
    wonOpportunitiesCount: number;
    wonOpportunitiesValue: number;
  };
  categoryDistribution: {
    category: string;
    totalRevenue: number;
    count: number;
    percentage: number;
  }[];
  topProducts: {
    id: string;
    name: string;
    category: string;
    subType: string;
    unitsSold: number;
    totalRevenue: number;
    avgPrice: number;
    basePrice: number | null;
    isActive: boolean;
  }[];
  channelsDistribution: {
    channel: string;
    totalRevenue: number;
    count: number;
  }[];
  monthlyTrend: {
    month: string;
    revenue: number;
    salesCount: number;
  }[];
}

const CATEGORY_ICONS: Record<string, string> = {
  CURSO: '🎓',
  SAAS: '💻',
  CONGRESSO: '🎪',
  LIVRO: '📘',
  INSTITUCIONAL: '🏢',
};

const CATEGORY_COLORS: Record<string, string> = {
  CURSO: '#818CF8', // Indigo
  SAAS: '#38BDF8', // Sky
  CONGRESSO: '#F472B6', // Pink
  LIVRO: '#FBBF24', // Amber
  INSTITUCIONAL: '#34D399', // Emerald
};

const CHANNEL_LABELS: Record<string, string> = {
  INBOUND_FORM: '📝 Formulário de Captura',
  TELEVENDAS: '📞 Balcão / Televendas',
  EVENTO_PRESENCIAL: '🎪 Evento Presencial',
  SITE: '🌐 Website / Checkout',
  IMPORTACAO_V4: '📥 Importação CSV V4',
};

export default function CommercialRevOpsDashboard() {
  const [data, setData] = useState<KPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchKpis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/commercial/kpis');
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Erro ao carregar dados de receita.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div>Carregando inteligência comercial e dados de receita...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center', borderColor: 'var(--red)', background: 'rgba(239, 68, 68, 0.05)' }}>
        <div style={{ color: 'var(--red)', fontWeight: 600, marginBottom: 8 }}>❌ Erro ao carregar métricas de RevOps</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>{error || 'Sem dados disponíveis.'}</p>
        <button onClick={fetchKpis} className="btn-action btn-action-outline">Tentar Novamente</button>
      </div>
    );
  }

  const { summary, categoryDistribution, topProducts, channelsDistribution } = data;

  const filteredProducts = topProducts.filter(p => {
    const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.subType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Top Header & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            💰 Performance Comercial & LTV (RevOps)
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Consolidação em tempo real de faturamento por catálogo, aquisições e fatos do banco PostgreSQL.
          </p>
        </div>
        <button 
          onClick={fetchKpis}
          className="btn-action btn-action-outline"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
        >
          🔄 Atualizar Métricas
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16
      }}>
        <KpiCard
          title="Faturamento Real Acumulado (LTV)"
          value={formatBRL(summary.totalRevenue)}
          accent="green"
          delay={0}
          subtitle={`${summary.totalSalesCount} transações / produtos faturados`}
        />
        <KpiCard
          title="Ticket Médio por Venda"
          value={formatBRL(summary.averageTicket)}
          accent="cyan"
          delay={60}
          subtitle="Valor médio pago por aquisição"
        />
        <KpiCard
          title="Assinaturas / Produtos Ativos"
          value={String(summary.activeProductsCount)}
          accent="purple"
          delay={120}
          subtitle="Contratos com acesso ativo no momento"
        />
        <KpiCard
          title="Oportunidades Ganhas (Kanban)"
          value={String(summary.wonOpportunitiesCount)}
          accent="yellow"
          delay={180}
          subtitle={`Total em pipeline: ${formatBRL(summary.wonOpportunitiesValue)}`}
        />
      </div>

      {/* Section: Category Revenue & Channels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        
        {/* Distribution by Product Category */}
        <div className="card" style={{ padding: 24, background: 'var(--surface)' }}>
          <h4 style={{ color: 'var(--text-primary)', margin: '0 0 16px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            📊 Faturamento por Categoria de Produto
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {categoryDistribution.map(cat => {
              const color = CATEGORY_COLORS[cat.category] || 'var(--accent)';
              const icon = CATEGORY_ICONS[cat.category] || '📦';
              return (
                <div key={cat.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{icon}</span> {cat.category}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>({cat.count} vendas)</span>
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{formatBRL(cat.totalRevenue)}</strong>
                      <span style={{ fontSize: 11, color: color, marginLeft: 8, fontWeight: 700 }}>
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: 8, background: 'var(--surface-raised)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(0, cat.percentage))}%`,
                      height: '100%',
                      background: color,
                      borderRadius: 4,
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribution by Sale Channel */}
        <div className="card" style={{ padding: 24, background: 'var(--surface)' }}>
          <h4 style={{ color: 'var(--text-primary)', margin: '0 0 16px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            🎯 Origem das Vendas por Canal
          </h4>
          
          {channelsDistribution.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Nenhum canal de venda computado ainda.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {channelsDistribution.map(ch => (
                <div key={ch.channel} style={{
                  padding: 12,
                  background: 'var(--surface-raised)',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {CHANNEL_LABELS[ch.channel] || ch.channel}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {ch.count} unidades convertidas
                    </div>
                  </div>
                  <strong style={{ fontSize: 14, color: 'var(--accent)' }}>
                    {formatBRL(ch.totalRevenue)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Section: Product Ranking (Curva ABC) */}
      <div className="card" style={{ padding: 24, background: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              🏆 Ranking de Produtos & Curva ABC
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Produtos ordenados pelo volume total de receita gerada no CRM.
            </p>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: 12,
                outline: 'none',
                width: 180
              }}
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Todas Categorias</option>
              <option value="CURSO">🎓 Cursos</option>
              <option value="SAAS">💻 SaaS</option>
              <option value="CONGRESSO">🎪 Congressos</option>
              <option value="LIVRO">📘 Livros</option>
              <option value="INSTITUCIONAL">🏢 Institucional</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Subtipo</th>
                <th style={{ textAlign: 'center' }}>Vendas</th>
                <th style={{ textAlign: 'right' }}>Preço Médio</th>
                <th style={{ textAlign: 'right' }}>Receita Total (LTV)</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    Nenhum produto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod, index) => {
                  const icon = CATEGORY_ICONS[prod.category] || '📦';
                  return (
                    <tr key={prod.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: index < 3 ? 'var(--accent)' : 'var(--surface-raised)',
                            color: index < 3 ? '#000' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700
                          }}>
                            {index + 1}
                          </span>
                          <div>
                            <div>{prod.name}</div>
                            {prod.basePrice !== null && (
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                Tabela: {formatBRL(prod.basePrice)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neu" style={{ fontSize: 10, textTransform: 'uppercase' }}>
                          {icon} {prod.category}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {prod.subType.replace('_', ' ')}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {prod.unitsSold}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {formatBRL(prod.avgPrice)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#4ADE80', fontSize: 13 }}>
                        {formatBRL(prod.totalRevenue)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
