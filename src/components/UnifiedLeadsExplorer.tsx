'use client';

import React, { useState, useEffect } from 'react';
import ImportCSVModal from './ImportCSVModal';
import BitrixImportModal from './BitrixImportModal';
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
  const [batchId, setBatchId] = useState<string>('all');
  const [batches, setBatches] = useState<any[]>([]);
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
  const [limit, setLimit] = useState<number>(20);

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
  const [isAllMatchingSelected, setIsAllMatchingSelected] = useState<boolean>(false);
  const [showConfirmAllModal, setShowConfirmAllModal] = useState<boolean>(false);
  const [bulkActionType, setBulkActionType] = useState<'campaign' | 'assign' | null>(null);
  const [selectedTargetJourneyId, setSelectedTargetJourneyId] = useState<string>('');
  const [selectedTargetAssigneeId, setSelectedTargetAssigneeId] = useState<string>('');
  const [isSubmittingBulk, setIsSubmittingBulk] = useState<boolean>(false);
  const [isExportingAll, setIsExportingAll] = useState<boolean>(false);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showBitrixModal, setShowBitrixModal] = useState<boolean>(false);
  const [auditorModalData, setAuditorModalData] = useState<{isOpen: boolean, customerId: string, journeyId: string}>({ isOpen: false, customerId: '', journeyId: '' });
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Helper to compute human readable active filter label
  const getActiveFilterLabel = (): string => {
    const parts: string[] = [];
    if (productId !== 'all') {
      if (productId === 'no_product') parts.push('Sem Produto Vinculado');
      else {
        const prod = products.find(p => p.id === productId);
        parts.push(`Curso/Produto: ${prod?.name?.trim() || productId}`);
      }
    }
    if (planId !== 'all') {
      if (planId === 'no_plan') parts.push('Sem Plano DentalGO');
      else {
        const pl = plans.find(p => p.id === planId);
        parts.push(`Plano: ${pl?.title || planId}`);
      }
    }
    if (source !== 'all') {
      parts.push(`Origem: ${source}`);
    }
    if (batchId !== 'all') {
      const bat = batches.find(b => b.id === batchId);
      parts.push(`Lote: ${bat?.fileName || batchId}`);
    }
    if (subscriptionStatus !== 'all') {
      const statusMap: Record<string, string> = { active: 'Ativo', expired: 'Expirado', canceled: 'Cancelado', no_plan: 'Sem Plano' };
      parts.push(`Status: ${statusMap[subscriptionStatus] || subscriptionStatus}`);
    }
    if (relationshipType !== 'all') {
      parts.push(`Relação: ${relationshipType}`);
    }
    if (journeyId !== 'all') {
      if (journeyId === 'none') parts.push('Fora de Campanha');
      else {
        const j = activeJourneys.find(jou => jou.id === journeyId);
        parts.push(`Campanha: ${j?.name || journeyId}`);
      }
    }
    if (assigneeId !== 'all') {
      if (assigneeId === 'unassigned') parts.push('Sem Operador (Órfão)');
      else {
        const a = agents.find(ag => ag.id === assigneeId);
        parts.push(`Operador: ${a?.name || assigneeId}`);
      }
    }
    if (search.trim()) {
      parts.push(`Busca: "${search.trim()}"`);
    }

    if (parts.length === 0) {
      return 'Diretório Geral de Leads';
    }
    return parts.join(' | ');
  };

  // Helper for filter query params
  const getFilterParams = () => ({
    source,
    batchId,
    planId,
    subscriptionStatus,
    productId,
    relationshipType,
    journeyId,
    assigneeId,
    stage,
    startDate,
    endDate,
    search
  });

  // Fetch Plans, Forms, Journeys, Batches on Mount
  useEffect(() => {
    async function loadOptions() {
      try {
        const [resPlans, resForms, resJourneys, resBatches] = await Promise.all([
          fetch('/api/plans').then(r => r.json()),
          fetch('/api/forms').then(r => r.json()),
          fetch('/api/campaigns').then(r => r.json()).catch(() => ({ journeys: [] })),
          fetch('/api/batches').then(r => r.json()).catch(() => ({ data: [] }))
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

        if (resBatches?.success && Array.isArray(resBatches.data)) {
          setBatches(resBatches.data);
        }
      } catch (err) {
        console.warn('Error loading filter options:', err);
      }
    }
    loadOptions();
  }, []);

  // Fetch Leads when filters, page, limit, or refreshKey change
  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          source,
          batchId,
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
          limit: limit.toString(),
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
  }, [source, batchId, planId, subscriptionStatus, productId, relationshipType, journeyId, assigneeId, stage, startDate, endDate, search, page, limit, refreshKey]);

  // Handle Header Checkbox Click
  const toggleSelectAllPage = () => {
    if (isAllMatchingSelected || (selectedLeadIds.length === leads.length && leads.length > 0)) {
      setSelectedLeadIds([]);
      setIsAllMatchingSelected(false);
    } else {
      setSelectedLeadIds(leads.map(l => l.id));
      setIsAllMatchingSelected(false);
    }
  };

  // Toggle Single Lead Checkbox
  const toggleSelectLead = (id: string) => {
    if (isAllMatchingSelected) {
      setIsAllMatchingSelected(false);
      setSelectedLeadIds(leads.map(l => l.id).filter(i => i !== id));
      return;
    }

    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter(i => i !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  // Confirm Selecting All Matching Leads
  const handleConfirmSelectAllMatching = () => {
    setIsAllMatchingSelected(true);
    setSelectedLeadIds(leads.map(l => l.id));
    setShowConfirmAllModal(false);
  };

  // Clear Selection
  const handleClearSelection = () => {
    setSelectedLeadIds([]);
    setIsAllMatchingSelected(false);
    setBulkActionType(null);
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
          selectAllMatching: isAllMatchingSelected,
          leadIds: isAllMatchingSelected ? [] : selectedLeadIds,
          filters: getFilterParams()
        })
      });
      const data = await res.json();
      if (data.success) {
        const selectedCampaign = activeJourneys.find(item => item.id === selectedTargetJourneyId);
        const isActiveCampaign = selectedCampaign?.entityType === 'CAMPAIGN' && ['ACTIVE', 'READY', 'TESTING'].includes(selectedCampaign?.status || '');
        const count = data.updatedCount || (isAllMatchingSelected ? total : selectedLeadIds.length);
        alert(isActiveCampaign
          ? `Sucesso! ${count} lead(s) matriculado(s) na campanha "${selectedCampaign?.name}" e distribuídos para a equipe.`
          : selectedCampaign?.entityType === 'CAMPAIGN'
            ? `Sucesso! ${count} contato(s) adicionados à audiência planejada da campanha.`
            : `Sucesso! ${count} leads inscritos na campanha.`);
        handleClearSelection();
        setRefreshKey(k => k + 1);
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
          selectAllMatching: isAllMatchingSelected,
          leadIds: isAllMatchingSelected ? [] : selectedLeadIds,
          filters: getFilterParams()
        })
      });
      const data = await res.json();
      if (data.success) {
        const count = data.updatedCount || (isAllMatchingSelected ? total : selectedLeadIds.length);
        alert(`Sucesso! Operador atualizado para ${count} leads.`);
        handleClearSelection();
        setRefreshKey(k => k + 1);
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
  const handleExportCSV = async () => {
    let exportList: any[] = [];

    if (isAllMatchingSelected) {
      setIsExportingAll(true);
      try {
        const params = new URLSearchParams({
          ...getFilterParams(),
          exportAll: 'true'
        });
        const res = await fetch(`/api/leads/explorer?${params.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.leads)) {
          exportList = data.leads;
        } else {
          alert('Erro ao buscar todos os contatos para exportação.');
          setIsExportingAll(false);
          return;
        }
      } catch (err: any) {
        alert(`Erro ao exportar: ${err.message}`);
        setIsExportingAll(false);
        return;
      } finally {
        setIsExportingAll(false);
      }
    } else {
      exportList = selectedLeadIds.length > 0
        ? leads.filter(l => selectedLeadIds.includes(l.id))
        : leads;
    }

    if (exportList.length === 0) {
      alert('Nenhum lead selecionado para exportação.');
      return;
    }

    const headers = ['Nome', 'Email', 'Telefone', 'Relação', 'Origem', 'Formulário', 'Canal', 'UTM Campaign', 'Plano', 'Produtos', 'Status Plano', 'Jornada', 'Operador', 'Data Cadastro'];
    const csvRows = [headers.join(',')];

    for (const l of exportList) {
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

  const isSelectionActive = isAllMatchingSelected || selectedLeadIds.length > 0;
  const isPageFullySelected = selectedLeadIds.length === leads.length && leads.length > 0;

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
              onClick={() => setShowBitrixModal(true)}
              className="btn-action"
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'var(--accent-glow)',
                color: 'var(--accent)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              title="Migrador Seguro Bitrix24"
            >
              🔄 Migrar Bitrix24
            </button>
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
              onChange={(e) => { setSearch(e.target.value); setPage(1); setIsAllMatchingSelected(false); }}
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
              onChange={(e) => { setRelationshipType(e.target.value); setPage(1); setIsAllMatchingSelected(false); }}
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
              onChange={(e) => { setSource(e.target.value); setPage(1); setIsAllMatchingSelected(false); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            >
              <option value="all">🌐 Todas as Origens</option>
              <option value="DENTALGO">🦷 DentalGO Sinc DB</option>
              <option value="BITRIX">🔄 Bitrix24 Migrado</option>
              <option value="CSV">📁 Importação CSV</option>
              {forms.map(f => (
                <option key={f.id} value={`Form Capture: ${f.title}`}>📑 Form: {f.title}</option>
              ))}
            </select>
          </div>

          {/* Lote de Importação */}
          {batches.length > 0 && (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>📦 Lote de Importação</label>
              <select
                value={batchId}
                onChange={(e) => { setBatchId(e.target.value); setPage(1); setIsAllMatchingSelected(false); }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              >
                <option value="all">📁 Todos os Lotes</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    📄 {b.fileName} ({b.successRows || b.totalRows} leads)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Plano DentalGO */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Plano DentalGO</label>
            <select
              value={planId}
              onChange={(e) => { setPlanId(e.target.value); setPage(1); setIsAllMatchingSelected(false); }}
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
              onChange={(e) => { setProductId(e.target.value); setPage(1); setIsAllMatchingSelected(false); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            >
              <option value="all">📦 Todos os Produtos</option>
              <option value="no_product">⚪ Sem Produto Vinculado</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>🎓 {product.name?.trim() || `Curso sem nome (${product.id})`}</option>
              ))}
            </select>
          </div>

          {/* Status Assinatura */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Status da Assinatura</label>
            <select
              value={subscriptionStatus}
              onChange={(e) => { setSubscriptionStatus(e.target.value); setPage(1); setIsAllMatchingSelected(false); }}
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
              onChange={(e) => { setJourneyId(e.target.value); setPage(1); setIsAllMatchingSelected(false); }}
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
              onChange={(e) => { setAssigneeId(e.target.value); setPage(1); setIsAllMatchingSelected(false); }}
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
              onChange={(e) => { setStartDate(e.target.value); setPage(1); setIsAllMatchingSelected(false); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
          </div>

          {/* Período Até */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Cadastro Até</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); setIsAllMatchingSelected(false); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Sticky Bulk Action Bar */}
      {isSelectionActive && (
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
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>
              {isAllMatchingSelected ? (
                <>⚡ Todos os <strong>{total}</strong> contatos do [{getActiveFilterLabel()}] selecionados</>
              ) : (
                <>⚡ <strong>{selectedLeadIds.length}</strong> lead(s) selecionado(s)</>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Action 1: Enrol Campaign */}
            {bulkActionType === 'campaign' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  value={selectedTargetJourneyId}
                  onChange={(e) => setSelectedTargetJourneyId(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#ffffff', color: '#000000', fontSize: '0.85rem' }}
                >
                  <option value="">Selecione a Campanha...</option>
                  {activeJourneys.map(j => {
                    const isDirect = j.entityType === 'CAMPAIGN' && ['ACTIVE', 'READY', 'TESTING'].includes(j?.status || '');
                    return (
                      <option key={j.id} value={j.id}>
                        {j.name}{j.entityType === 'CAMPAIGN' ? ` — ${j.status || 'DRAFT'} (${isDirect ? 'matrícula direta' : 'preparar audiência'})` : ' — legado'}
                      </option>
                    );
                  })}
                </select>
                {(() => {
                  const selCamp = activeJourneys.find(j => j.id === selectedTargetJourneyId);
                  const isDirect = selCamp?.entityType === 'CAMPAIGN' && ['ACTIVE', 'READY', 'TESTING'].includes(selCamp?.status || '');
                  return (
                    <button
                      onClick={handleBulkEnrolCampaign}
                      disabled={isSubmittingBulk}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {isSubmittingBulk ? 'Confirmando...' : (isDirect ? `🚀 Matricular ${isAllMatchingSelected ? total : selectedLeadIds.length} na Campanha` : `📝 Adicionar ${isAllMatchingSelected ? total : selectedLeadIds.length} à Audiência`)}
                    </button>
                  );
                })()}
                <button onClick={() => setBulkActionType(null)} style={{ background: 'transparent', border: '1px solid #ffffff', color: '#ffffff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              </div>
            ) : bulkActionType === 'assign' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                  {isSubmittingBulk ? 'Confirmando...' : `Confirmar para ${isAllMatchingSelected ? total : selectedLeadIds.length} Leads`}
                </button>
                <button onClick={() => setBulkActionType(null)} style={{ background: 'transparent', border: '1px solid #ffffff', color: '#ffffff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setBulkActionType('campaign')}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ffffff', color: '#4f46e5', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  🚀 Lançar em Campanha ({isAllMatchingSelected ? total : selectedLeadIds.length})
                </button>
                <button
                  onClick={() => setBulkActionType('assign')}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  👤 Atribuir Operador
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={isExportingAll}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isExportingAll ? '⏳ Exportando...' : `📥 Exportar CSV (${isAllMatchingSelected ? total : selectedLeadIds.length})`}
                </button>
                <button
                  onClick={handleClearSelection}
                  style={{ background: 'transparent', border: 'none', color: '#e0e7ff', textDecoration: 'underline', cursor: 'pointer', marginLeft: '8px', fontSize: '0.85rem' }}
                >
                  Limpar Seleção
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Select All Matching Banner when page is fully selected and total > leads.length */}
      {isPageFullySelected && total > leads.length && !isAllMatchingSelected && (
        <div style={{
          background: 'var(--accent-glow, rgba(79, 70, 229, 0.12))',
          border: '1px solid var(--accent, #4f46e5)',
          padding: '12px 20px',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          color: 'var(--text-primary)',
          fontSize: '0.9rem'
        }}>
          <div>
            ℹ️ Todos os <strong>{leads.length}</strong> contatos desta página estão selecionados.
          </div>
          <button
            onClick={() => setShowConfirmAllModal(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent, #4f46e5)',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
            }}
          >
            👉 Selecionar todos os {total} contatos do [{getActiveFilterLabel()}]
          </button>
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
                    checked={isAllMatchingSelected || (selectedLeadIds.length === leads.length && leads.length > 0)}
                    onChange={toggleSelectAllPage}
                    style={{ cursor: 'pointer' }}
                    title={isAllMatchingSelected ? "Todos os leads do filtro selecionados" : "Selecionar página atual"}
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
                const isChecked = isAllMatchingSelected || selectedLeadIds.includes(lead.id);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface-raised)', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Mostrando página {page} de {totalPages} ({total} leads no total)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Custom Limit Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Exibir:
              </label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                  setIsAllMatchingSelected(false);
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {[20, 30, 40, 50, 100, 150, 200].map(size => (
                  <option key={size} value={size}>{size} por página</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={isExportingAll}
              className="btn-action"
              style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              title="Exportar tela atual ou selecionados para CSV"
            >
              {isExportingAll ? '⏳ Exportando...' : '⬇️ Exportar CSV'}
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

      {/* Confirmation Modal: Select All Matching Leads */}
      {showConfirmAllModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface, #1e293b)',
            border: '1px solid var(--border, rgba(255,255,255,0.1))',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--accent-glow, rgba(79, 70, 229, 0.2))',
                color: 'var(--accent, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 700
              }}>
                🎯
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Confirmar Seleção em Massa
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Ação abrangente em toda a base filtrada
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                Deseja realmente selecionar todos os <strong style={{ color: 'var(--accent, #6366f1)' }}>{total} contatos</strong> do filtro:
              </p>

              <div style={{
                background: 'var(--surface-raised, rgba(0,0,0,0.2))',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'var(--text-primary)'
              }}>
                📌 [{getActiveFilterLabel()}]
              </div>

              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.4'
              }}>
                💡 Ao confirmar, qualquer ação posterior (como <strong>Lançar em Campanha</strong>, <strong>Atribuir Operador</strong> ou <strong>Exportar CSV</strong>) será aplicada a <strong>todos os {total} contatos</strong> correspondentes a este filtro, mesmo que estejam em outras páginas.
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface-raised)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowConfirmAllModal(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSelectAllMatching}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--accent, #4f46e5)',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                }}
              >
                Sim, Selecionar Todos ({total})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      <ImportCSVModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        onSuccess={handleImportSuccess}
      />

      {/* Bitrix Migration Modal */}
      <BitrixImportModal
        isOpen={showBitrixModal}
        onClose={() => setShowBitrixModal(false)}
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
