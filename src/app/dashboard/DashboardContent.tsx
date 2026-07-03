'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import KpiCard from '@/components/ui/KpiCard';
import GrowthTrendChart from '@/components/charts/GrowthTrendChart';
import ChurnChart from '@/components/charts/ChurnChart';
import PlanDistributionChart from '@/components/charts/PlanDistributionChart';
import CohortTable from '@/components/charts/CohortTable';
import ThemeToggle from '@/components/ThemeToggle';
import MonthSelector from '@/components/ui/MonthSelector';

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STAGE_LABELS: Record<string, string> = {
  novo_cadastro: 'Sem Contato',
  primeiro_contato: 'Tentativa',
  em_negociacao: 'Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

const STAGE_COLORS: Record<string, string> = {
  novo_cadastro: '#6B6B7B',
  primeiro_contato: '#FACC15',
  em_negociacao: '#C084FC',
  ganho: '#4ADE80',
  perdido: '#F87171',
};

interface DashboardContentProps {
  kpis: Record<string, any> | null;
  revenue: Record<string, any> | null;
  users: Record<string, any> | null;
  churn: Record<string, any> | null;
  subscriptions: Record<string, any> | null;
  period: string;
  month: string;
  currentUser: { id: string; name: string; email: string; role: string } | null;
  agents: Array<{ id: string; name: string; email: string; role: string; isActive: boolean }>;
}

export default function DashboardContent({
  kpis,
  revenue,
  users,
  churn,
  subscriptions,
  period,
  month,
  currentUser,
  agents,
}: DashboardContentProps) {
  const isAdmin = currentUser?.role === 'ADMIN';

  // State Management
  const [activeTab, setActiveTab] = useState<'financeiro' | 'kanban' | 'leads' | 'team'>(
    isAdmin ? 'financeiro' : 'kanban'
  );
  
  // Leads data state (loaded dynamically for Kanban & Leads Table)
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Filters state
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterAssignee, setFilterAssignee] = useState(isAdmin ? 'all' : currentUser?.id || 'all');
  const [filterMonth, setFilterMonth] = useState(month);

  // Modals state
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showFastAcquisitionModal, setShowFastAcquisitionModal] = useState(false);
  
  // Forms state
  const [fastStage, setFastStage] = useState('novo_cadastro');
  const [fastAssignee, setFastAssignee] = useState('unassigned');
  const [fastNote, setFastNote] = useState('');
  const [detailNote, setDetailNote] = useState('');
  const [showLossReasons, setShowLossReasons] = useState(false);

  // Team management state
  const [teamList, setTeamList] = useState(agents);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [agentForm, setAgentForm] = useState({ name: '', email: '', password: '', role: 'AGENT', isActive: true });
  const [agentError, setAgentError] = useState<string | null>(null);

  // Load leads based on current filters
  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      let url = `/api/leads?month=${filterMonth}`;
      if (filterPlan !== 'all') url += `&plan=${filterPlan}`;
      if (filterSearch.trim() !== '') url += `&search=${encodeURIComponent(filterSearch)}`;
      if (filterStage !== '') url += `&stage=${filterStage}`;
      if (filterAssignee !== 'all') url += `&assigneeId=${filterAssignee}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setLeads(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    setFilterMonth(month);
  }, [month]);

  useEffect(() => {
    fetchLeads();
  }, [filterPlan, filterSearch, filterStage, filterAssignee, filterMonth]);

  // Handle Export
  const handleExport = (type: string) => {
    window.open(`/api/reports/export?type=${type}&month=${filterMonth}`, '_blank');
  };

  // Drag and Drop handlers for Kanban
  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    e.dataTransfer.setData('text/plain', leadId.toString());
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const leadIdStr = e.dataTransfer.getData('text/plain');
    if (!leadIdStr) return;
    const leadId = Number(leadIdStr);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, stage: targetStage }),
      });
      if (res.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error('Drop stage update failed:', err);
    }
  };

  // Open Fast Acquisition modal
  const openFastAcquisition = (lead: any) => {
    setSelectedLead(lead);
    setFastStage(lead.stage || 'novo_cadastro');
    setFastAssignee(lead.assignee?.id || 'unassigned');
    setFastNote('');
    setShowFastAcquisitionModal(true);
  };

  // Submit Fast Acquisition form
  const submitFastAcquisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          stage: fastStage,
          assigneeId: fastAssignee,
          note: fastNote.trim() !== '' ? fastNote : undefined,
        }),
      });

      if (res.ok) {
        setShowFastAcquisitionModal(false);
        fetchLeads();
      }
    } catch (err) {
      console.error('Fast acquisition save failed:', err);
    }
  };

  // Open Detailed Timeline modal
  const openTimeline = (lead: any) => {
    setSelectedLead(lead);
    setDetailNote('');
    setShowLossReasons(false);
    setShowTimelineModal(true);
  };

  // One-click disposition handler
  const handleActionDisposition = async (type: string, lossReason?: string) => {
    if (!selectedLead) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          type,
          lossReason,
          note: detailNote.trim() !== '' ? detailNote : undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setSelectedLead((prev: any) => ({
          ...prev,
          stage: json.data.stage,
          notes: json.data.notes || [],
        }));
        setDetailNote('');
        setShowLossReasons(false);
        fetchLeads();

        if (type === 'LOST' || type === 'RECOVERED') {
          setShowTimelineModal(false);
        }
      }
    } catch (err) {
      console.error('Failed to register action disposition:', err);
    }
  };

  // Submit new note in Timeline modal
  const submitDetailNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || detailNote.trim() === '') return;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          note: detailNote,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        // Update local modal data
        setSelectedLead((prev: any) => ({
          ...prev,
          notes: json.data.notes || [],
        }));
        setDetailNote('');
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to save timeline note:', err);
    }
  };

  // Update details (stage or assignee) from within timeline modal
  const handleDetailUpdate = async (field: 'stage' | 'assigneeId', value: string) => {
    if (!selectedLead) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          [field]: value,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setSelectedLead((prev: any) => ({
          ...prev,
          stage: json.data.stage,
          assignee: json.data.assignee,
        }));
        fetchLeads();
      }
    } catch (err) {
      console.error(`Failed to update ${field} inside timeline:`, err);
    }
  };

  // Team Management: Save Agent (Create/Update)
  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgentError(null);

    const method = editingAgent ? 'PUT' : 'POST';
    const body = editingAgent
      ? { id: editingAgent.id, ...agentForm }
      : agentForm;

    try {
      const res = await fetch('/api/agents', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setAgentError(json.error || 'Erro ao salvar colaborador.');
        return;
      }

      // Refresh list
      const listRes = await fetch('/api/agents');
      if (listRes.ok) {
        const listJson = await listRes.json();
        setTeamList(listJson.data || []);
      }

      setShowTeamModal(false);
      setEditingAgent(null);
    } catch (err) {
      setAgentError('Erro de rede ao salvar.');
    }
  };

  // Team Management: Toggle Agent Status
  const handleToggleAgentStatus = async (agent: any) => {
    if (!confirm(`Deseja alterar o status de ${agent.name}?`)) return;

    try {
      const res = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agent.id, isActive: !agent.isActive }),
      });

      if (res.ok) {
        // Refresh list
        const listRes = await fetch('/api/agents');
        if (listRes.ok) {
          const listJson = await listRes.json();
          setTeamList(listJson.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to toggle agent status:', err);
    }
  };

  const openAddAgent = () => {
    setEditingAgent(null);
    setAgentForm({ name: '', email: '', password: '', role: 'AGENT', isActive: true });
    setAgentError(null);
    setShowTeamModal(true);
  };

  const openEditAgent = (agent: any) => {
    setEditingAgent(agent);
    setAgentForm({ name: agent.name, email: agent.email, password: '', role: agent.role, isActive: agent.isActive });
    setAgentError(null);
    setShowTeamModal(true);
  };

  // Helper to format whatsapp links
  const formatWhatsappLink = (phone: string) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${finalPhone}`;
  };

  return (
    <div style={{ minHeight: '100vh', padding: '24px 24px 64px' }}>
      
      {/* Top Header Menu Navigation */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap', gap: 16,
      }}>
        {/* Logo */}
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center'
          }}>
            <span style={{ color: 'var(--accent)' }}>Dental</span>GO
            <span style={{ color: 'var(--text-faint)', fontWeight: 400, marginLeft: 8 }}>CRM</span>
          </h1>
          <p className="label-sm" style={{ marginTop: 2 }}>
            Cockpit Comercial &middot; <span style={{ color: 'var(--accent)' }}>v2.0</span>
          </p>
        </div>

        {/* Tab Navigation Menu */}
        <nav style={{ display: 'flex', gap: 6, background: 'var(--surface-raised)', padding: 4, borderRadius: 10 }}>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('financeiro')}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: activeTab === 'financeiro' ? 'var(--accent-glow)' : 'transparent',
                color: activeTab === 'financeiro' ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              📈 Painel BI Admin
            </button>
          )}
          <button 
            onClick={() => setActiveTab('kanban')}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: activeTab === 'kanban' ? 'var(--accent-glow)' : 'transparent',
              color: activeTab === 'kanban' ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            📋 Funil Kanban
          </button>
          <button 
            onClick={() => setActiveTab('leads')}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: activeTab === 'leads' ? 'var(--accent-glow)' : 'transparent',
              color: activeTab === 'leads' ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            🔍 Fila de Leads
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('team')}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: activeTab === 'team' ? 'var(--accent-glow)' : 'transparent',
                color: activeTab === 'team' ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              👥 Equipe CRM
            </button>
          )}
          {(isAdmin || currentUser?.role === 'POST_SALES') && (
            <button 
              onClick={() => window.location.href = '/dashboard/post-sales'}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: 'transparent',
                color: 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              📣 Pós-Venda
            </button>
          )}
        </nav>

        {/* User profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ThemeToggle />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser?.name}</div>
            <div className="label-sm" style={{ fontSize: 10, color: 'var(--accent)' }}>{currentUser?.role === 'ADMIN' ? 'Administrador' : 'Agente'}</div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8,
              background: 'transparent', color: 'var(--red)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* RENDER ACTIVE TAB */}
      
      {/* 1. Dashboard Financeiro (ADMIN Only) */}
      {activeTab === 'financeiro' && isAdmin && (
        <div className="animate-fadeUp">
          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>
              Métricas e Relatórios Analíticos
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="label-sm">Competência:</span>
              <MonthSelector currentMonth={filterMonth} />
            </div>
          </div>

          {/* KPI Cards */}
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

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <GrowthTrendChart 
              data={(revenue?.revenueByPeriod || []) as any[]} 
              month={filterMonth}
            />
            <PlanDistributionChart
              data={(users?.usersByPlan as any[]) || []}
              payingUsers={Number(kpis?.activeCoreCount) || 0}
              courtesyUsers={Number(kpis?.categories?.cortesia) || 0}
            />
          </div>

          {/* Churn & Top Plans */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 16, marginBottom: 24 }}>
            <ChurnChart data={(churn?.churn as any[]) ?? []} />
            
            {/* Top plans table */}
            <div className="card">
              <div className="label" style={{ marginBottom: 16 }}>Quantidade de Assinantes por Plano</div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Nome do Plano</th>
                      <th>Valor (Mensalidade)</th>
                      <th>Intervalo</th>
                      <th style={{ textAlign: 'right' }}>Assinantes Ativos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((users?.usersByPlan || []) as any[]).map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.planTitle}</td>
                        <td>{formatBRL(p.price)}</td>
                        <td><span className="badge badge-neu">{p.intervalType}</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>{p.subscriberCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Cohort Table */}
          <div style={{ marginBottom: 24 }}>
            <CohortTable data={(churn?.cohort as any[]) ?? []} />
          </div>

          {/* Admin CSV Export Panel */}
          <div className="card animate-fadeUp" style={{ 
            padding: '24px', border: '1px solid var(--accent-light)', 
            background: 'linear-gradient(rgba(var(--accent-rgb), 0.03), transparent)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              📥 Exportação de Relatórios Fiscais e Gerais
            </h3>
            <p className="label-sm" style={{ marginBottom: 20 }}>
              Gere e faça o download de relatórios em formato CSV estruturado para análise em planilhas ou auditorias fiscais.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => handleExport('general')} className="btn-action btn-action-outline">
                📄 Relatório Geral (Todos os Clientes)
              </button>
              <button onClick={() => handleExport('monthly')} className="btn-action btn-action-outline">
                📅 Relatório de KPIs (Faturamento Mensal)
              </button>
              <button onClick={() => handleExport('financial')} className="btn-action btn-action-purple">
                💰 Relatório Financeiro (Separação Anuais/Recorrentes)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Quadro Kanban (ADMIN & AGENT) */}
      {activeTab === 'kanban' && (
        <div className="animate-fadeUp">
          {/* Kanban Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>
                Funil de CRM Comercial
              </h2>
              <p className="label-sm" style={{ marginTop: 2 }}>Arraste os cards para alterar a etapa ou clique para registrar notas de contato.</p>
            </div>

            {/* Kanban Filter Toolbar */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {isAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="label-sm">Agente:</span>
                  <select 
                    value={filterAssignee} 
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="all">Fila Geral (Todos)</option>
                    <option value="unassigned">Sem Responsável</option>
                    {teamList.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="label-sm">Plano:</span>
                <select 
                  value={filterPlan} 
                  onChange={(e) => setFilterPlan(e.target.value)}
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
                >
                  <option value="all">Todos os Planos</option>
                  <option value="none">Sem Plano (Grátis)</option>
                  {users?.usersByPlan?.map((p: any) => (
                    <option key={p.planId} value={p.planId}>{p.planTitle}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="label-sm">Mês:</span>
                <MonthSelector currentMonth={filterMonth} />
              </div>
            </div>
          </div>

          {/* Kanban Board Grid */}
          {loadingLeads ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, height: 400 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton" style={{ height: '100%', borderRadius: 12 }}></div>
              ))}
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12, alignItems: 'start'
            }}>
              {Object.keys(STAGE_LABELS).map((stageKey) => {
                const stageLeads = leads.filter(l => l.stage === stageKey);
                return (
                  <div 
                    key={stageKey}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, stageKey)}
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: 12, minHeight: 480
                    }}
                  >
                    {/* Stage Header */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: 16, borderBottom: `2px solid ${STAGE_COLORS[stageKey]}`,
                      paddingBottom: 8
                    }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                        {STAGE_LABELS[stageKey]}
                      </span>
                      <span className="badge badge-neu" style={{ fontSize: 11 }}>{stageLeads.length}</span>
                    </div>

                    {/* Cards Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {stageLeads.length === 0 ? (
                        <div style={{
                          textAlign: 'center', padding: '30px 10px', fontSize: 11,
                          color: 'var(--text-faint)', border: '1px dashed var(--border)', borderRadius: 8
                        }}>
                          Sem contatos
                        </div>
                      ) : (
                        stageLeads.map((lead) => (
                          <div 
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            onClick={() => openTimeline(lead)}
                            style={{
                              background: 'var(--surface-raised)', border: '1px solid var(--border)',
                              borderRadius: 8, padding: 12, cursor: 'grab',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                          >
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
                              {lead.fullName}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                              {lead.plan ? lead.plan.title : 'Sem Plano / Grátis'}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {lead.notes?.length || 0} notas
                              </span>
                              {lead.assignee && (
                                <span className="badge badge-cyan" style={{ fontSize: 9, padding: '2px 6px' }}>
                                  👤 {lead.assignee.name.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Fila de Leads (ADMIN & AGENT) */}
      {activeTab === 'leads' && (
        <div className="card animate-fadeUp">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>Fila Unificada de Leads</div>
              <div className="label-sm">Filtre cadastros da base core e inicie interações rápidas.</div>
            </div>
            <span className="badge badge-cyan">{leads.length} leads carregados</span>
          </div>

          {/* Filtering Bar */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12, marginBottom: 20, padding: 16, background: 'var(--surface-raised)', borderRadius: 12
          }}>
            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Buscar Nome/Email:</label>
              <input 
                type="text" 
                value={filterSearch} 
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Ex: Carlos Silva..."
                style={{
                  width: '100%', padding: '8px 12px', background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13
                }}
              />
            </div>

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Plano:</label>
              <select 
                value={filterPlan} 
                onChange={(e) => setFilterPlan(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
              >
                <option value="all">Todos os Planos</option>
                <option value="none">Cadastro Grátis (Sem Plano)</option>
                {users?.usersByPlan?.map((p: any) => (
                  <option key={p.planId} value={p.planId}>{p.planTitle}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Estágio CRM:</label>
              <select 
                value={filterStage} 
                onChange={(e) => setFilterStage(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
              >
                <option value="">Todos os Estágios</option>
                {Object.entries(STAGE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {isAdmin && (
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Responsável:</label>
                <select 
                  value={filterAssignee} 
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
                >
                  <option value="all">Todos os Agentes</option>
                  <option value="unassigned">Sem Responsável</option>
                  {teamList.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Competência:</label>
              <MonthSelector currentMonth={filterMonth} />
            </div>
          </div>

          {/* Leads Table Grid */}
          {loadingLeads ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 20 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton" style={{ height: 40, width: '100%' }}></div>
              ))}
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Data Cadastro</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>Plano Ativo</th>
                    <th>Etapa CRM</th>
                    <th>Responsável</th>
                    <th style={{ textAlign: 'center' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
                        Nenhum lead correspondente aos filtros foi encontrado.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => {
                      const waLink = formatWhatsappLink(lead.phoneNumber);
                      return (
                        <tr key={lead.id}>
                          <td><span className="stat-mono" style={{ fontSize: 12 }}>{lead.createdAt.slice(0, 10)}</span></td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.fullName}</td>
                          <td><span className="stat-mono" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{lead.email}</span></td>
                          <td>
                            {lead.phoneNumber ? (
                              waLink ? (
                                <a 
                                  href={waLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  🟢 {lead.phoneNumber}
                                </a>
                              ) : lead.phoneNumber
                            ) : (
                              <span style={{ color: 'var(--text-faint)' }}>Sem fone</span>
                            )}
                          </td>
                          <td>
                            <span style={{ color: lead.plan ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {lead.plan ? lead.plan.title : 'Sem Plano / Grátis'}
                            </span>
                          </td>
                          <td>
                            <span 
                              className="badge" 
                              style={{ 
                                background: `${STAGE_COLORS[lead.stage]}1A`, 
                                color: STAGE_COLORS[lead.stage],
                                border: `1px solid ${STAGE_COLORS[lead.stage]}33`
                              }}
                            >
                              {STAGE_LABELS[lead.stage]}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: lead.assignee ? 'var(--accent)' : 'var(--text-muted)', fontSize: 12 }}>
                              {lead.assignee ? lead.assignee.name : 'Não Atribuído'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              onClick={() => openFastAcquisition(lead)}
                              style={{
                                padding: '6px 12px', border: '1px solid var(--accent)', borderRadius: 8,
                                background: 'transparent', color: 'var(--accent)', fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--accent)';
                                e.currentTarget.style.color = '#fff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--accent)';
                              }}
                            >
                              ⚡ Atender
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. Gerenciar Equipe (ADMIN Only) */}
      {activeTab === 'team' && isAdmin && (
        <div className="card animate-fadeUp">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>Gerenciar Equipe do CRM</div>
              <div className="label-sm">Cadastre, altere cargos, defina senhas e gerencie acessos de colaboradores.</div>
            </div>
            <button onClick={openAddAgent} className="btn-action btn-action-purple">
              ➕ Novo Colaborador
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome do Colaborador</th>
                  <th>E-mail de Acesso</th>
                  <th>Cargo / Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {teamList.map((agent) => (
                  <tr key={agent.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{agent.name}</td>
                    <td><span className="stat-mono" style={{ fontSize: 12 }}>{agent.email}</span></td>
                    <td>
                      <span className={`badge ${agent.role === 'ADMIN' ? 'badge-cyan' : 'badge-neu'}`}>
                        {agent.role === 'ADMIN' ? 'Administrador' : 'Agente Comercial'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${agent.isActive ? 'badge-up' : 'badge-down'}`}>
                        {agent.isActive ? 'Ativo' : 'Desativado'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button 
                          onClick={() => openEditAgent(agent)}
                          style={{
                            padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8,
                            background: 'var(--surface-raised)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleToggleAgentStatus(agent)}
                          style={{
                            padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8,
                            background: 'transparent', color: agent.isActive ? 'var(--red)' : 'var(--green)', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {agent.isActive ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 1: Ação Rápida (Fast Acquisition) */}
      {/* ====================================================================== */}
      {showFastAcquisitionModal && selectedLead && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', background: 'var(--surface)', padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>
                Ação Rápida: {selectedLead.fullName}
              </h3>
              <button 
                onClick={() => setShowFastAcquisitionModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={submitFastAcquisition} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Alterar Etapa do Funil:</label>
                <select 
                  value={fastStage} 
                  onChange={(e) => setFastStage(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
                >
                  {Object.entries(STAGE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Atribuir Responsável:</label>
                <select 
                  value={fastAssignee} 
                  onChange={(e) => setFastAssignee(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
                >
                  <option value="unassigned">Sem Responsável (Fila Livre)</option>
                  {teamList.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Nota Rápida de Atendimento:</label>
                <textarea 
                  value={fastNote} 
                  onChange={(e) => setFastNote(e.target.value)}
                  placeholder="Descreva o que conversou com o lead (ex: Aguardando retorno na segunda-feira)..."
                  style={{
                    width: '100%', height: 100, padding: '10px 14px', background: 'var(--surface-raised)',
                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', resize: 'none', outline: 'none', fontSize: 13
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button 
                  type="button" 
                  onClick={() => setShowFastAcquisitionModal(false)} 
                  className="btn-action btn-action-outline"
                  style={{ padding: '8px 16px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-action btn-action-purple"
                  style={{ padding: '8px 16px' }}
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 2: Ficha Detalhada / Kanban Timeline */}
      {/* ====================================================================== */}
      {showTimelineModal && selectedLead && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', background: 'var(--surface)', padding: 32, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 700 }}>
                  Ficha de Atendimento Comercial
                </h3>
                <p className="label-sm" style={{ marginTop: 2 }}>{selectedLead.fullName} &middot; <span style={{ color: 'var(--text-muted)' }}>{selectedLead.email}</span></p>
              </div>
              <button 
                onClick={() => setShowTimelineModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Quick selectors Row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24,
              padding: 16, background: 'var(--surface-raised)', borderRadius: 12
            }}>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Ações Rápidas de Atendimento:</label>
                {!showLossReasons ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button
                      onClick={() => handleActionDisposition('CONTACT_ATTEMPT')}
                      style={{
                        padding: '10px 8px', background: 'rgba(192, 132, 252, 0.15)', border: '1px solid var(--accent)',
                        borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.2s'
                      }}
                    >
                      💬 Contato Feito
                    </button>
                    <button
                      onClick={() => handleActionDisposition('MEETING_SCHEDULED')}
                      style={{
                        padding: '10px 8px', background: 'rgba(96, 165, 250, 0.15)', border: '1px solid #60A5FA',
                        borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.2s'
                      }}
                    >
                      📅 Agendar Retorno
                    </button>
                    <button
                      onClick={() => handleActionDisposition('RECOVERED')}
                      style={{
                        padding: '10px 8px', background: 'rgba(74, 222, 128, 0.15)', border: '1px solid #4ADE80',
                        borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.2s'
                      }}
                    >
                      🤝 Ganho
                    </button>
                    <button
                      onClick={() => setShowLossReasons(true)}
                      style={{
                        padding: '10px 8px', background: 'rgba(248, 113, 113, 0.15)', border: '1px solid #F87171',
                        borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.2s'
                      }}
                    >
                      🚨 Perda / Descarte
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#F87171' }}>Selecione o Motivo da Perda:</span>
                      <button 
                        onClick={() => setShowLossReasons(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Voltar
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        onClick={() => handleActionDisposition('LOST', 'PRICE_TOO_HIGH')}
                        style={{
                          padding: '8px', background: 'var(--surface)', border: '1px solid #F87171',
                          borderRadius: 8, color: '#F87171', fontSize: 11, fontWeight: 500, cursor: 'pointer'
                        }}
                      >
                        💰 Preço Alto
                      </button>
                      <button
                        onClick={() => handleActionDisposition('LOST', 'GHOSTING')}
                        style={{
                          padding: '8px', background: 'var(--surface)', border: '1px solid #F87171',
                          borderRadius: 8, color: '#F87171', fontSize: 11, fontWeight: 500, cursor: 'pointer'
                        }}
                      >
                        🔇 Sem Resposta
                      </button>
                      <button
                        onClick={() => handleActionDisposition('LOST', 'MISSING_CONTENT')}
                        style={{
                          padding: '8px', background: 'var(--surface)', border: '1px solid #F87171',
                          borderRadius: 8, color: '#F87171', fontSize: 11, fontWeight: 500, cursor: 'pointer'
                        }}
                      >
                        📚 Sem Conteúdo
                      </button>
                      <button
                        onClick={() => handleActionDisposition('LOST', 'UNQUALIFIED')}
                        style={{
                          padding: '8px', background: 'var(--surface)', border: '1px solid #F87171',
                          borderRadius: 8, color: '#F87171', fontSize: 11, fontWeight: 500, cursor: 'pointer'
                        }}
                      >
                        🚫 Não Qualificado
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Atribuído a:</label>
                <select 
                  value={selectedLead.assignee?.id || 'unassigned'} 
                  onChange={(e) => handleDetailUpdate('assigneeId', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
                >
                  <option value="unassigned">Sem Responsável (Fila Livre)</option>
                  {teamList.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                  Estágio Atual: <span style={{ fontWeight: 700, color: STAGE_COLORS[selectedLead.stage] || '#6B6B7B' }}>{STAGE_LABELS[selectedLead.stage] || selectedLead.stage}</span>
                </div>
              </div>
            </div>

            {/* Timeline Notes Area */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 24, paddingRight: 8 }}>
              <div className="label" style={{ marginBottom: 12 }}>Histórico de Interações (Timeline)</div>
              {selectedLead.notes?.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)',
                  border: '1px dashed var(--border)', borderRadius: 8, fontSize: 13
                }}>
                  Nenhuma anotação registrada ainda para este lead.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedLead.notes.map((note: any) => (
                    <div 
                      key={note.id} 
                      style={{ 
                        background: 'var(--surface-raised)', borderLeft: '3px solid var(--accent)',
                        borderRadius: '0 8px 8px 0', padding: 12 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>👤 {note.authorName}</span>
                        <span className="stat-mono" style={{ color: 'var(--text-muted)' }}>{new Date(note.date).toLocaleString('pt-BR')}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                        {note.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Note Input Box */}
            <form onSubmit={submitDetailNote}>
              <div style={{ display: 'flex', gap: 12 }}>
                <textarea 
                  value={detailNote} 
                  onChange={(e) => setDetailNote(e.target.value)}
                  placeholder="Escreva uma nova anotação opcional (clique nos botões de ação acima para registrar com estágio)..."
                  style={{
                    flex: 1, height: 60, padding: '10px 14px', background: 'var(--surface-raised)',
                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', resize: 'none', outline: 'none', fontSize: 13
                  }}
                />
                <button 
                  type="submit" 
                  className="btn-action btn-action-purple"
                  style={{ padding: '0 24px', borderRadius: 8 }}
                  disabled={!detailNote.trim()}
                >
                  Apenas Anotar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 3: Cadastro / Edição de Colaborador */}
      {/* ====================================================================== */}
      {showTeamModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', background: 'var(--surface)', padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>
                {editingAgent ? 'Editar Colaborador' : 'Adicionar Novo Colaborador'}
              </h3>
              <button 
                onClick={() => setShowTeamModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {agentError && (
              <div style={{ background: 'var(--red-glow)', color: 'var(--red)', padding: 12, borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
                ⚠️ {agentError}
              </div>
            )}

            <form onSubmit={handleSaveAgent} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Nome Completo:</label>
                <input 
                  type="text" 
                  required
                  value={agentForm.name} 
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  placeholder="Ex: Mateus Oliveira"
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13
                  }}
                />
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>E-mail de Acesso:</label>
                <input 
                  type="email" 
                  required
                  value={agentForm.email} 
                  onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                  placeholder="Ex: mateus@dentalgo.com"
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13
                  }}
                />
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>
                  {editingAgent ? 'Nova Senha (deixe vazio para não alterar):' : 'Senha de Acesso:'}
                </label>
                <input 
                  type="password" 
                  required={!editingAgent}
                  value={agentForm.password} 
                  onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13
                  }}
                />
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Cargo / Nível de Acesso:</label>
                <select 
                  value={agentForm.role} 
                  onChange={(e) => setAgentForm({ ...agentForm, role: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
                >
                  <option value="AGENT">Agente Comercial (Visualização restrita)</option>
                  <option value="ADMIN">Administrador (Acesso total)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button 
                  type="button" 
                  onClick={() => setShowTeamModal(false)} 
                  className="btn-action btn-action-outline"
                  style={{ padding: '8px 16px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-action btn-action-purple"
                  style={{ padding: '8px 16px' }}
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
