'use client';

import React, { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Product {
  id: string;
  name: string;
}

interface Journey {
  id: string;
  name: string;
}

interface Plan {
  id: string;
  title: string;
}

interface FormOption {
  id: string;
  title: string;
}

interface UnifiedLeadsExplorerProps {
  agents: Agent[];
  products?: Product[];
  journeys?: Journey[];
  onSelectLead?: (lead: any) => void;
}

export default function UnifiedLeadsExplorer({
  agents = [],
  products = [],
  journeys = [],
  onSelectLead,
}: UnifiedLeadsExplorerProps) {
  // State for Filters
  const [source, setSource] = useState<string>('all');
  const [planId, setPlanId] = useState<string>('all');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('all');
  const [productId, setProductId] = useState<string>('all');
  const [journeyId, setJourneyId] = useState<string>('all');
  const [assigneeId, setAssigneeId] = useState<string>('all');
  const [stage, setStage] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Loaded Options
  const [plans, setPlans] = useState<Plan[]>([]);
  const [forms, setForms] = useState<FormOption[]>([]);
  const [activeJourneys, setActiveJourneys] = useState<Journey[]>(journeys);

  // Data State
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Selection & Bulk Action State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkActionType, setBulkActionType] = useState<'campaign' | 'assign' | null>(null);
  const [selectedTargetJourneyId, setSelectedTargetJourneyId] = useState<string>('');
  const [selectedTargetAssigneeId, setSelectedTargetAssigneeId] = useState<string>('');
  const [isSubmittingBulk, setIsSubmittingBulk] = useState<boolean>(false);

  // Fetch Plans, Forms, Journeys on Mount
  useEffect(() => {
    async function loadOptions() {
      try {
        const [resPlans, resForms, resJourneys] = await Promise.all([
          fetch('/api/plans').then(r => r.json()),
          fetch('/api/forms').then(r => r.json()),
          fetch('/api/campaigns').then(r => r.json()).catch(() => ({ journeys: [] }))
        ]);

        if (resPlans?.success && Array.isArray(resPlans.plans)) {
          setPlans(resPlans.plans);
        }
        if (resForms?.success && Array.isArray(resForms.forms)) {
          setForms(resForms.forms);
        }
        if (resJourneys?.data && Array.isArray(resJourneys.data)) {
          setActiveJourneys(resJourneys.data);
        }
      } catch (err) {
        console.warn('Error loading filter options:', err);
      }
    }
    loadOptions();
  }, []);

  // Fetch Leads when filters or page change
  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          source,
          planId,
          subscriptionStatus,
          productId,
          journeyId,
          assigneeId,
          stage,
          startDate,
          endDate,
          search,
          page: page.toString(),
          limit: '25',
        });

        const res = await fetch(`/api/leads/explorer?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          setLeads(data.leads || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error('Error fetching leads:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, [source, planId, subscriptionStatus, productId, journeyId, assigneeId, stage, startDate, endDate, search, page]);

  // Handle Select All / Toggle Single Lead
  const toggleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter(i => i !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  // Bulk Enrol in Campaign
  const handleBulkEnrolCampaign = async () => {
    if (!selectedTargetJourneyId) {
      alert('Selecione uma campanha de destino.');
      return;
    }
    setIsSubmittingBulk(true);
    try {
      const res = await fetch('/api/leads/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enrol_campaign',
          targetJourneyId: selectedTargetJourneyId,
          leadIds: selectedLeadIds,
          filters: {}
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Sucesso! ${data.updatedCount || selectedLeadIds.length} leads inscritos na campanha.`);
        setSelectedLeadIds([]);
        setBulkActionType(null);
        // Refresh page
        setPage(p => p);
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Erro ao executar ação: ${err.message}`);
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  // Bulk Assign Operator
  const handleBulkAssignOperator = async () => {
    if (selectedTargetAssigneeId === '') {
      alert('Selecione um operador de destino.');
      return;
    }
    setIsSubmittingBulk(true);
    try {
      const res = await fetch('/api/leads/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          targetAssigneeId: selectedTargetAssigneeId,
          leadIds: selectedLeadIds,
          filters: {}
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Sucesso! Operador atualizado para ${data.updatedCount || selectedLeadIds.length} leads.`);
        setSelectedLeadIds([]);
        setBulkActionType(null);
        setPage(p => p);
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Erro ao executar ação: ${err.message}`);
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const selectedLeadsList = leads.filter(l => selectedLeadIds.includes(l.id));
    if (selectedLeadsList.length === 0) return;

    const headers = ['Nome', 'Email', 'Telefone', 'Origem', 'Plano', 'Status Plano', 'Jornada', 'Operador', 'Data Cadastro'];
    const csvRows = [headers.join(',')];

    for (const l of selectedLeadsList) {
      const row = [
        `"${(l.name || '').replace(/"/g, '""')}"`,
        `"${(l.email || '').replace(/"/g, '""')}"`,
        `"${(l.phone || '').replace(/"/g, '""')}"`,
        `"${(l.source || '').replace(/"/g, '""')}"`,
        `"${(l.planTitle || '').replace(/"/g, '""')}"`,
        `"${(l.subscriptionStatus || '').replace(/"/g, '""')}"`,
        `"${(l.journeyName || '').replace(/"/g, '""')}"`,
        `"${(l.assigneeName || '').replace(/"/g, '""')}"`,
        `"${l.createdAt ? new Date(l.createdAt).toLocaleDateString('pt-BR') : ''}"`
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(74, 222, 128, 0.15)', color: '#4ADE80', fontWeight: 600, fontSize: '0.8rem' }}>🟢 Ativo</span>;
      case 'expired':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(250, 204, 21, 0.15)', color: '#FACC15', fontWeight: 600, fontSize: '0.8rem' }}>🟡 Expirado</span>;
      case 'canceled':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(248, 113, 113, 0.15)', color: '#F87171', fontWeight: 600, fontSize: '0.8rem' }}>🔴 Cancelado</span>;
      default:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(156, 163, 175, 0.15)', color: '#9CA3AF', fontWeight: 600, fontSize: '0.8rem' }}>🛒 Sem Plano</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header & Controls Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface-elevated, #181824)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color, #27273a)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-primary, #ffffff)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              👥 Diretório Unificado de Clientes & Audiência
              <span style={{ fontSize: '0.85rem', padding: '3px 10px', borderRadius: '20px', background: 'var(--accent-glow, rgba(99, 102, 241, 0.2))', color: 'var(--accent, #6366f1)', fontWeight: 600 }}>
                {total} leads encontrados
              </span>
            </h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary, #a1a1aa)', fontSize: '0.9rem' }}>
              Explore toda a base do DentalGO, Formulários do Site, CSVs e Cursos em tempo real com ações em massa.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nome, e-mail ou telefone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border-color, #27273a)',
                background: 'var(--surface, #0f0f17)',
                color: '#fff',
                width: '320px',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        {/* Multi-Filter Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '8px' }}>
          {/* Origem */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #a1a1aa)', display: 'block', marginBottom: '4px' }}>Origem do Lead</label>
            <select
              value={source}
              onChange={(e) => { setSource(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color, #27273a)', background: 'var(--surface, #0f0f17)', color: '#fff', fontSize: '0.85rem' }}
            >
              <option value="all">🌐 Todas as Origens</option>
              <option value="DENTALGO">🦷 DentalGO Sinc DB</option>
              <option value="CSV">📁 Importação CSV</option>
              {forms.map(f => (
                <option key={f.id} value={`Form Capture: ${f.title}`}>📑 Form: {f.title}</option>
              ))}
            </select>
          </div>

          {/* Plano DentalGO */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #a1a1aa)', display: 'block', marginBottom: '4px' }}>Plano DentalGO</label>
            <select
              value={planId}
              onChange={(e) => { setPlanId(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color, #27273a)', background: 'var(--surface, #0f0f17)', color: '#fff', fontSize: '0.85rem' }}
            >
              <option value="all">💳 Todos os Planos</option>
              <option value="no_plan">🛒 Sem Plano (Carrinho Abandonado)</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>💵 {p.title}</option>
              ))}
            </select>
          </div>

          {/* Status Assinatura */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #a1a1aa)', display: 'block', marginBottom: '4px' }}>Status da Assinatura</label>
            <select
              value={subscriptionStatus}
              onChange={(e) => { setSubscriptionStatus(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color, #27273a)', background: 'var(--surface, #0f0f17)', color: '#fff', fontSize: '0.85rem' }}
            >
              <option value="all">🌐 Todos os Status</option>
              <option value="active">🟢 Ativo</option>
              <option value="expired">🟡 Expirado</option>
              <option value="canceled">🔴 Cancelado</option>
              <option value="no_plan">🛒 Sem Plano / Pendente</option>
            </select>
          </div>

          {/* Campanha */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #a1a1aa)', display: 'block', marginBottom: '4px' }}>Campanha / Jornada</label>
            <select
              value={journeyId}
              onChange={(e) => { setJourneyId(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color, #27273a)', background: 'var(--surface, #0f0f17)', color: '#fff', fontSize: '0.85rem' }}
            >
              <option value="all">🚀 Todas as Campanhas</option>
              <option value="none">⭕ Fora de Campanha</option>
              {activeJourneys.map(j => (
                <option key={j.id} value={j.id}>🎯 {j.name}</option>
              ))}
            </select>
          </div>

          {/* Operador */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #a1a1aa)', display: 'block', marginBottom: '4px' }}>Atendente / Operador</label>
            <select
              value={assigneeId}
              onChange={(e) => { setAssigneeId(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color, #27273a)', background: 'var(--surface, #0f0f17)', color: '#fff', fontSize: '0.85rem' }}
            >
              <option value="all">👤 Todos os Operadores</option>
              <option value="unassigned">⚠️ Não Atribuído (Órfão)</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>👨‍💼 {a.name}</option>
              ))}
            </select>
          </div>

          {/* Período De */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #a1a1aa)', display: 'block', marginBottom: '4px' }}>Cadastro De</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color, #27273a)', background: 'var(--surface, #0f0f17)', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          {/* Período Até */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #a1a1aa)', display: 'block', marginBottom: '4px' }}>Cadastro Até</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color, #27273a)', background: 'var(--surface, #0f0f17)', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Sticky Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div style={{
          position: 'sticky',
          top: '16px',
          zIndex: 100,
          background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
          padding: '16px 24px',
          borderRadius: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)',
          color: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>
              ⚡ {selectedLeadIds.length} lead(s) selecionado(s)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Action 1: Enrol Campaign */}
            {bulkActionType === 'campaign' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={selectedTargetJourneyId}
                  onChange={(e) => setSelectedTargetJourneyId(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#fff', color: '#000', fontSize: '0.85rem' }}
                >
                  <option value="">Selecione a Campanha...</option>
                  {activeJourneys.map(j => (
                    <option key={j.id} value={j.id}>{j.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleBulkEnrolCampaign}
                  disabled={isSubmittingBulk}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSubmittingBulk ? 'Confirmando...' : 'Confirmar Lançamento'}
                </button>
                <button onClick={() => setBulkActionType(null)} style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              </div>
            ) : bulkActionType === 'assign' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={selectedTargetAssigneeId}
                  onChange={(e) => setSelectedTargetAssigneeId(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#fff', color: '#000', fontSize: '0.85rem' }}
                >
                  <option value="">Selecione o Operador...</option>
                  <option value="unassign">⚠️ Desatribuir (Voltar para Fila)</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleBulkAssignOperator}
                  disabled={isSubmittingBulk}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSubmittingBulk ? 'Confirmando...' : 'Confirmar Atribuição'}
                </button>
                <button onClick={() => setBulkActionType(null)} style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setBulkActionType('campaign')}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ffffff', color: '#4f46e5', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  🚀 Lançar em Campanha
                </button>
                <button
                  onClick={() => setBulkActionType('assign')}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  👤 Atribuir Operador
                </button>
                <button
                  onClick={handleExportCSV}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  📥 Exportar CSV
                </button>
                <button
                  onClick={() => setSelectedLeadIds([])}
                  style={{ background: 'transparent', border: 'none', color: '#e0e7ff', textDecoration: 'underline', cursor: 'pointer', marginLeft: '8px', fontSize: '0.85rem' }}
                >
                  Desmarcar Todos
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div style={{ background: 'var(--surface-elevated, #181824)', borderRadius: '16px', border: '1px solid var(--border-color, #27273a)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary, #a1a1aa)' }}>
            ⏳ Carregando dados da audiência...
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary, #a1a1aa)' }}>
            🔍 Nenhum lead encontrado com os filtros selecionados.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface, #0f0f17)', borderBottom: '1px solid var(--border-color, #27273a)', color: 'var(--text-secondary, #a1a1aa)' }}>
                <th style={{ padding: '14px 16px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.length === leads.length && leads.length > 0}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '14px 16px' }}>Cliente / Lead</th>
                <th style={{ padding: '14px 16px' }}>Origem</th>
                <th style={{ padding: '14px 16px' }}>Plano DentalGO</th>
                <th style={{ padding: '14px 16px' }}>Status Assinatura</th>
                <th style={{ padding: '14px 16px' }}>Jornada Ativa</th>
                <th style={{ padding: '14px 16px' }}>Atendente</th>
                <th style={{ padding: '14px 16px' }}>Data Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const isChecked = selectedLeadIds.includes(lead.id);
                return (
                  <tr
                    key={lead.id}
                    style={{
                      borderBottom: '1px solid var(--border-color, #27273a)',
                      background: isChecked ? 'var(--accent-glow, rgba(99, 102, 241, 0.08))' : 'transparent',
                      transition: 'background 0.15s'
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectLead(lead.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>
                        {lead.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #a1a1aa)' }}>
                        {lead.email} {lead.phone ? `• ${lead.phone}` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '6px', background: 'var(--surface, #0f0f17)', color: 'var(--text-secondary, #a1a1aa)', border: '1px solid var(--border-color, #27273a)' }}>
                        {lead.source}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text-primary, #ffffff)' }}>
                      {lead.planTitle}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {getStatusBadge(lead.subscriptionStatus)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '0.8rem', color: lead.journeyName !== 'Fora de Campanha' ? '#818cf8' : 'var(--text-secondary, #a1a1aa)' }}>
                        {lead.journeyName}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-primary, #ffffff)' }}>
                      {lead.assigneeName}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary, #a1a1aa)', fontSize: '0.82rem' }}>
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border-color, #27273a)', background: 'var(--surface, #0f0f17)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #a1a1aa)' }}>
            Mostrando página {page} de {totalPages} ({total} leads no total)
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #27273a)',
                background: page <= 1 ? 'transparent' : 'var(--surface-elevated, #181824)',
                color: page <= 1 ? '#555' : '#fff',
                cursor: page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ◀ Anterior
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #27273a)',
                background: page >= totalPages ? 'transparent' : 'var(--surface-elevated, #181824)',
                color: page >= totalPages ? '#555' : '#fff',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Próxima ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
