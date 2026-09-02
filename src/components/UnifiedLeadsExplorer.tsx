'use client';

import React, { useState, useEffect } from 'react';
import ImportCSVModal from './ImportCSVModal';
import VisualAuditorModal from './ui/VisualAuditorModal';

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
  status?: string;
  entityType?: 'CAMPAIGN' | 'LEGACY_JOURNEY';
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
  const [relationshipType, setRelationshipType] = useState<string>('all');
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

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [auditorModalData, setAuditorModalData] = useState<{isOpen: boolean, customerId: string, journeyId: string}>({ isOpen: false, customerId: '', journeyId: '' });
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Fetch Plans, Forms, Journeys on Mount
  useEffect(() => {
    async function loadOptions() {
      try {
        const [resPlans, resForms, resJourneys] = await Promise.all([
          fetch('/api/plans').then(r => r.json()),
          fetch('/api/forms').then(r => r.json()),
          fetch('/api/campaigns').then(r => r.json()).catch(() => ({ journeys: [] }))
        ]);

        const planList = resPlans?.data || resPlans?.plans;
        if (resPlans?.success && Array.isArray(planList)) {
          setPlans(planList);
        }

        const formList = resForms?.data || resForms?.forms;
        if (resForms?.success && Array.isArray(formList)) {
          setForms(formList.map((f: any) => ({ id: f.id, title: f.name || f.title })));
        }

        const journeyList = resJourneys?.data || resJourneys?.journeys;
        if (Array.isArray(journeyList) && journeyList.length > 0) {
          setActiveJourneys(journeyList);
        }
      } catch (err) {
        console.warn('Error loading filter options:', err);
      }
    }
    loadOptions();
  }, []);

  // Fetch Leads when filters, page, or refreshKey change
  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          source,
          planId,
          subscriptionStatus,
          productId,
          relationshipType,
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
  }, [source, planId, subscriptionStatus, productId, relationshipType, journeyId, assigneeId, stage, startDate, endDate, search, page, refreshKey]);

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
        const selectedCampaign = activeJourneys.find(item => item.id === selectedTargetJourneyId);
        alert(selectedCampaign?.entityType === 'CAMPAIGN'
          ? `Sucesso! ${data.updatedCount || selectedLeadIds.length} contato(s) adicionados à audiência planejada. Nenhum fluxo foi disparado.`
          : `Sucesso! ${data.updatedCount || selectedLeadIds.length} leads inscritos na campanha.`);
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

    const headers = ['Nome', 'Email', 'Telefone', 'Relação', 'Origem', 'Formulário', 'Canal', 'UTM Campaign', 'Plano', 'Produtos', 'Status Plano', 'Jornada', 'Operador', 'Data Cadastro'];
    const csvRows = [headers.join(',')];

    for (const l of selectedLeadsList) {
      const row = [
        `"${(l.name || '').replace(/"/g, '""')}"`,
        `"${(l.email || '').replace(/"/g, '""')}"`,
        `"${(l.phone || '').replace(/"/g, '""')}"`,
        `"${(l.relationshipType || '').replace(/"/g, '""')}"`,
        `"${(l.source || '').replace(/"/g, '""')}"`,
        `"${(l.formName || '').replace(/"/g, '""')}"`,
        `"${([l.attributionChannel, l.attributionPlatform].filter(Boolean).join(' / ') || '').replace(/"/g, '""')}"`,
        `"${(l.utmCampaign || '').replace(/"/g, '""')}"`,
        `"${(l.planTitle || '').replace(/"/g, '""')}"`,
        `"${((l.products || []).map((product: any) => product.name).join('; ') || '').replace(/"/g, '""')}"`,
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

  const handleImportSuccess = () => {
    // Refresh leads table
    setPage(1);
    setRefreshKey(k => k + 1);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'var(--green-glow, rgba(74, 222, 128, 0.15))', color: 'var(--green, #16A34A)', fontWeight: 600, fontSize: '0.8rem' }}>🟢 Ativo</span>;
      case 'expired':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'var(--yellow-glow, rgba(250, 204, 21, 0.15))', color: 'var(--yellow, #CA8A04)', fontWeight: 600, fontSize: '0.8rem' }}>🟡 Expirado</span>;
      case 'canceled':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'var(--red-glow, rgba(248, 113, 113, 0.15))', color: 'var(--red, #DC2626)', fontWeight: 600, fontSize: '0.8rem' }}>🔴 Cancelado</span>;
      default:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'var(--surface-raised)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', border: '1px solid var(--border)' }}>🛒 Sem Plano</span>;
    }
  };

  const getRelationshipBadge = (type: string) => {
    const definitions: Record<string, { label: string; color: string; background: string }> = {
      LEAD: { label: '🎯 Lead', color: '#A78BFA', background: 'rgba(167, 139, 250, 0.15)' },
      CUSTOMER: { label: '💳 Cliente', color: '#4ADE80', background: 'rgba(74, 222, 128, 0.15)' },
      CUSTOMER_AND_LEAD: { label: '🔄 Cliente + Lead', color: '#38BDF8', background: 'rgba(56, 189, 248, 0.15)' },
      FORMER_CUSTOMER: { label: '⏸ Ex-cliente', color: '#FBBF24', background: 'rgba(251, 191, 36, 0.15)' },
      CONTACT: { label: '⚪ Contato', color: 'var(--text-secondary)', background: 'var(--surface-raised)' }
    };
    const definition = definitions[type] || definitions.CONTACT;
    return <span style={{ padding: '4px 9px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, color: definition.color, background: definition.background, whiteSpace: 'nowrap' }}>{definition.label}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header & Controls Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              👥 Diretório Unificado de Clientes & Audiência
              <span style={{ fontSize: '0.85rem', padding: '3px 10px', borderRadius: '20px', background: 'var(--accent-glow)', color: 'var(--accent)', fontWeight: 600 }}>
                {total} leads encontrados
              </span>
            </h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Explore toda a base do DentalGO, Formulários do Site, CSVs e Cursos em tempo real com ações em massa.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowImportModal(true)}
              className="btn-action"
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              title="Importar planilha de Leads (V4)"
            >
              📥 Importar CSV (V4)
            </button>
            <input
              type="text"
              placeholder="🔍 Buscar por nome, e-mail ou telefone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--surface-raised)',
                color: 'var(--text-primary)',
                width: '320px',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        {/* Multi-Filter Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '8px' }}>
          {/* Relação comercial */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Relação Comercial</label>
            <select
              value={relationshipType}
              onChange={(e) => { setRelationshipType(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            >
              <option value="all">Todos: Leads e Clientes</option>
              <option value="LEAD">🎯 Somente Leads</option>
              <option value="CUSTOMER">💳 Somente Clientes</option>
              <option value="CUSTOMER_AND_LEAD">🔄 Clientes com nova oportunidade</option>
              <option value="FORMER_CUSTOMER">⏸ Ex-clientes / cancelados</option>
              <option value="CONTACT">⚪ Apenas contatos</option>
            </select>
          </div>

          {/* Origem */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Origem do Lead</label>
            <select
              value={source}
              onChange={(e) => { setSource(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
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
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Plano DentalGO</label>
            <select
              value={planId}
              onChange={(e) => { setPlanId(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            >
              <option value="all">💳 Todos os Planos</option>
              <option value="no_plan">🛒 Sem Plano (Carrinho Abandonado)</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>💵 {p.title}</option>
              ))}
            </select>
          </div>

          {/* Produto / Curso */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Produto / Curso</label>
            <select
              value={productId}
              onChange={(e) => { setProductId(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            >
              <option value="all">📦 Todos os Produtos</option>
              <option value="no_product">⚪ Sem Produto Vinculado</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>🎓 {product.name}</option>
              ))}
            </select>
          </div>

          {/* Status Assinatura */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Status da Assinatura</label>
            <select
              value={subscriptionStatus}
              onChange={(e) => { setSubscriptionStatus(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
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
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Campanha / Jornada</label>
            <select
              value={journeyId}
              onChange={(e) => { setJourneyId(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
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
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Atendente / Operador</label>
            <select
              value={assigneeId}
              onChange={(e) => { setAssigneeId(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
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
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Cadastro De</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
          </div>

          {/* Período Até */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Cadastro Até</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
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
          color: '#ffffff'
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
                  style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#ffffff', color: '#000000', fontSize: '0.85rem' }}
                >
                  <option value="">Selecione a Campanha...</option>
                  {activeJourneys.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.name}{j.entityType === 'CAMPAIGN' ? ` — ${j.status || 'DRAFT'} (preparar audiência)` : ' — legado'}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBulkEnrolCampaign}
                  disabled={isSubmittingBulk}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSubmittingBulk ? 'Confirmando...' : 'Adicionar à Audiência'}
                </button>
                <button onClick={() => setBulkActionType(null)} style={{ background: 'transparent', border: '1px solid #ffffff', color: '#ffffff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              </div>
            ) : bulkActionType === 'assign' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={selectedTargetAssigneeId}
                  onChange={(e) => setSelectedTargetAssigneeId(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#ffffff', color: '#000000', fontSize: '0.85rem' }}
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
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSubmittingBulk ? 'Confirmando...' : 'Confirmar Atribuição'}
                </button>
                <button onClick={() => setBulkActionType(null)} style={{ background: 'transparent', border: '1px solid #ffffff', color: '#ffffff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
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
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            ⏳ Carregando dados da audiência...
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            🔍 Nenhum lead encontrado com os filtros selecionados.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '14px 16px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.length === leads.length && leads.length > 0}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '14px 16px' }}>Cliente / Lead</th>
                <th style={{ padding: '14px 16px' }}>Relação</th>
                <th style={{ padding: '14px 16px' }}>E-mail</th>
                <th style={{ padding: '14px 16px' }}>Telefone / WhatsApp</th>
                <th style={{ padding: '14px 16px' }}>Origem</th>
                <th style={{ padding: '14px 16px' }}>Plano DentalGO</th>
                <th style={{ padding: '14px 16px' }}>Produtos / Cursos</th>
                <th style={{ padding: '14px 16px' }}>Status Assinatura</th>
                <th style={{ padding: '14px 16px' }}>Jornada Ativa</th>
                <th style={{ padding: '14px 16px' }}>Atendente</th>
                <th style={{ padding: '14px 16px' }}>Data Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const isChecked = selectedLeadIds.includes(lead.id);
                const rawDigits = lead.phone ? lead.phone.replace(/\D/g, '') : '';
                const waLink = rawDigits.length >= 10 
                  ? (rawDigits.startsWith('55') ? `https://wa.me/${rawDigits}` : `https://wa.me/55${rawDigits}`) 
                  : null;

                return (
                  <tr
                    key={lead.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isChecked ? 'var(--accent-glow)' : 'transparent',
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
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-glow)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                          {(lead.name || 'L').charAt(0).toUpperCase()}
                        </span>
                        {lead.name || 'Lead Sem Nome'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {getRelationshipBadge(lead.relationshipType)}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      {lead.email ? (
                        <a href={`mailto:${lead.email}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                          📧 {lead.email}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                      {lead.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>📱 {lead.phone}</span>
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              title="Abrir no WhatsApp"
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: 'rgba(34, 197, 94, 0.15)',
                                color: '#22c55e',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              💬 WhatsApp
                            </a>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        {lead.source}
                      </span>
                      {(lead.formName || lead.attributionChannel) && (
                        <div style={{ marginTop: 5, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {lead.formName || 'Formulário'}
                          {lead.attributionChannel ? ` · ${lead.attributionChannel}${lead.attributionPlatform ? ` / ${lead.attributionPlatform}` : ''}` : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {lead.planTitle}
                    </td>
                    <td style={{ padding: '14px 16px', minWidth: '220px' }}>
                      {Array.isArray(lead.products) && lead.products.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {lead.products.slice(0, 3).map((product: any) => (
                            <span
                              key={product.id}
                              title={`${product.name} · ${product.status}`}
                              style={{
                                padding: '3px 7px', borderRadius: '6px', fontSize: '0.72rem',
                                background: product.status === 'CANCELED' ? 'rgba(248, 113, 113, 0.12)' : 'var(--accent-glow)',
                                color: product.status === 'CANCELED' ? '#F87171' : 'var(--accent)',
                                border: `1px solid ${product.status === 'CANCELED' ? 'rgba(248, 113, 113, 0.25)' : 'var(--border)'}`
                              }}
                            >
                              {product.name}{product.status === 'CANCELED' ? ' (cancelado)' : product.status === 'INTEREST' ? ' (interesse)' : ''}
                            </span>
                          ))}
                          {lead.products.length > 3 && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                              +{lead.products.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {getStatusBadge(lead.subscriptionStatus)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: lead.journeyName !== 'Fora de Campanha' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                          {lead.journeyName}
                        </span>
                        {lead.journeyId && (
                          <button
                            onClick={() => setAuditorModalData({ isOpen: true, customerId: lead.id, journeyId: lead.journeyId })}
                            className="btn-action btn-action-outline"
                            style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                            title="Ver no Fluxo"
                          >
                            👁️
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {lead.assigneeName}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Mostrando página {page} de {totalPages} ({total} leads no total)
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleExportCSV}
              className="btn-action"
              style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              title="Exportar tela atual para CSV"
            >
              ⬇️ Exportar
            </button>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: page <= 1 ? 'transparent' : 'var(--surface)',
                color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
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
                border: '1px solid var(--border)',
                background: page >= totalPages ? 'transparent' : 'var(--surface)',
                color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Próxima ▶
            </button>
          </div>
        </div>
      </div>

      {/* Import CSV Modal */}
      <ImportCSVModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        onSuccess={handleImportSuccess}
      />

      {/* Visual Auditor Modal */}
      <VisualAuditorModal
        isOpen={auditorModalData.isOpen}
        onClose={() => setAuditorModalData({ ...auditorModalData, isOpen: false })}
        customerId={auditorModalData.customerId}
        journeyId={auditorModalData.journeyId}
      />
    </div>
  );
}
