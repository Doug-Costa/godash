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
  const [activeTab, setActiveTab] = useState<'financeiro' | 'kanban' | 'leads' | 'team' | 'cancelados' | 'alerts' | 'campanhas'>(
    isAdmin ? 'financeiro' : 'alerts'
  );
  
  // Leads data state (loaded dynamically for Kanban & Leads Table)
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Canceled data state (loaded dynamically with pagination)
  const [canceledData, setCanceledData] = useState<any[]>([]);
  const [canceledTotal, setCanceledTotal] = useState(0);
  const [canceledPage, setCanceledPage] = useState(1);
  const canceledLimit = 10;
  const [canceledTotalPages, setCanceledTotalPages] = useState(1);
  const [loadingCanceled, setLoadingCanceled] = useState(false);
  const [canceledFilterAllMonths, setCanceledFilterAllMonths] = useState(false);

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
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // Team management state
  const [teamList, setTeamList] = useState(agents);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [agentForm, setAgentForm] = useState({ name: '', email: '', password: '', role: 'AGENT', isActive: true });
  const [agentError, setAgentError] = useState<string | null>(null);

  // Novas variáveis de estado da Expansão do CRM
  const [alertsData, setAlertsData] = useState<{ taskAlerts: any[], orphanedLeads: any[], expiringLeads: any[] }>({ taskAlerts: [], orphanedLeads: [], expiringLeads: [] });
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [campaignsData, setCampaignsData] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [kpiData, setKpiData] = useState<any | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(false);
  const [selectedKpiCampaignId, setSelectedKpiCampaignId] = useState<string>('');

  // Seleção múltipla para Campanhas
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);

  // Modais de Campanhas
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignSteps, setCampaignSteps] = useState<{ dayOffset: number, channel: string, messageTemplate: string }[]>([
    { dayOffset: 1, channel: 'WHATSAPP', messageTemplate: 'Olá {{nome}}, tudo bem?' }
  ]);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignCampaignId, setAssignCampaignId] = useState('');
  const [assignUserIds, setAssignUserIds] = useState<string[]>([]);

  // Congelamento de leads
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeUntil, setFreezeUntil] = useState('');
  const [freezeReason, setFreezeReason] = useState('');

  // Paginação e filtros do Alert Center
  const [taskPage, setTaskPage] = useState(1);
  const [orphanPage, setOrphanPage] = useState(1);
  const [orphanMonth, setOrphanMonth] = useState('all');
  const [expiringPage, setExpiringPage] = useState(1);
  const [alertsPagination, setAlertsPagination] = useState({
    taskAlerts: { page: 1, limit: 10, total: 0, totalPages: 1 },
    orphanedLeads: { page: 1, limit: 10, total: 0, totalPages: 1 },
    expiringLeads: { page: 1, limit: 10, total: 0, totalPages: 1 }
  });

  // Filtros e paginação da tabela de assinantes por plano
  const [plansFilter, setPlansFilter] = useState('all');
  const [plansPage, setPlansPage] = useState(1);

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

  const fetchCanceledLeads = async () => {
    if (!isAdmin) return;
    setLoadingCanceled(true);
    try {
      let url = `/api/leads/canceled?page=${canceledPage}&limit=${canceledLimit}`;
      if (!canceledFilterAllMonths) {
        url += `&month=${filterMonth}`;
      }
      if (filterPlan !== 'all') url += `&plan=${filterPlan}`;
      if (filterSearch.trim() !== '') url += `&search=${encodeURIComponent(filterSearch)}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setCanceledData(json.data || []);
        setCanceledTotal(json.pagination?.total || 0);
        setCanceledTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching canceled leads:', err);
    } finally {
      setLoadingCanceled(false);
    }
  };

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch(`/api/alerts?taskPage=${taskPage}&taskLimit=10&orphanPage=${orphanPage}&orphanLimit=10&orphanMonth=${orphanMonth}&expiringPage=${expiringPage}&expiringLimit=10`);
      if (res.ok) {
        const json = await res.json();
        setAlertsData(json.data || { taskAlerts: [], orphanedLeads: [], expiringLeads: [] });
        if (json.pagination) {
          setAlertsPagination(json.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const json = await res.json();
        setCampaignsData(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const fetchKpis = async () => {
    setLoadingKpis(true);
    try {
      let url = `/api/reports/kpis?`;
      if (selectedKpiCampaignId) url += `&campaignId=${selectedKpiCampaignId}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setKpiData(json.data || null);
      }
    } catch (err) {
      console.error('Failed to fetch KPIs:', err);
    } finally {
      setLoadingKpis(false);
    }
  };

  useEffect(() => {
    setFilterMonth(month);
  }, [month]);

  useEffect(() => {
    fetchLeads();
    if (activeTab === 'cancelados') {
      fetchCanceledLeads();
    }
    if (activeTab === 'alerts') {
      fetchAlerts();
    }
    if (activeTab === 'campanhas') {
      fetchCampaigns();
      fetchKpis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPlan, filterSearch, filterStage, filterAssignee, filterMonth, canceledFilterAllMonths, activeTab, selectedKpiCampaignId]);

  useEffect(() => {
    if (activeTab === 'alerts') {
      fetchAlerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, taskPage, orphanPage, orphanMonth, expiringPage]);

  useEffect(() => {
    if (activeTab === 'cancelados') {
      fetchCanceledLeads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, canceledPage, canceledLimit]);

  useEffect(() => {
    setCanceledPage(1);
  }, [filterMonth, filterPlan, filterSearch, canceledFilterAllMonths]);

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
  const openFastAcquisition = (lead: any, isFromCanceled = false) => {
    setSelectedLead({
      ...lead,
      isFromCanceledList: isFromCanceled
    });
    setFastStage(isFromCanceled ? 'novo_cadastro' : (lead.stage || 'novo_cadastro'));
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
          tag: selectedLead.isFromCanceledList ? 'CANCELED_CLIENT' : selectedLead.tag,
        }),
      });

      if (res.ok) {
        setShowFastAcquisitionModal(false);
        fetchLeads();
        if (activeTab === 'cancelados') {
          fetchCanceledLeads();
        }
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
    setShowScheduler(false);
    setScheduledDate('');
    setShowTimelineModal(true);
  };

  // One-click disposition handler
  const handleActionDisposition = async (type: string, lossReason?: string, scheduledFor?: string) => {
    if (!selectedLead) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          type,
          lossReason,
          lostReason: lossReason, // Mapeamento para o novo campo do SQLite
          note: detailNote.trim() !== '' ? detailNote : undefined,
          scheduledFor,
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
        setShowScheduler(false);
        setScheduledDate('');
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

  // ── Ações de Congelamento ──────────────────────────────────────────────────
  const openFreezeModal = (lead: any) => {
    setSelectedLead(lead);
    setFreezeUntil('');
    setFreezeReason('');
    setShowFreezeModal(true);
    setShowTimelineModal(false);
  };

  const handleFreezeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !freezeUntil || !freezeReason) return;

    try {
      const res = await fetch('/api/leads/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: selectedLead.id,
          freezeUntil,
          reason: freezeReason
        })
      });

      if (res.ok) {
        setShowFreezeModal(false);
        fetchLeads();
        if (activeTab === 'alerts') {
          fetchAlerts();
        }
      }
    } catch (err) {
      console.error('Failed to freeze lead:', err);
    }
  };

  // ── Ações de Alertas (Alert Center) ────────────────────────────────────────
  const handleClaimOrphaned = async (personId: number) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim', personId })
      });
      if (res.ok) {
        fetchAlerts();
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to claim orphaned lead:', err);
    }
  };

  const handleCompleteAlert = async (alertId: string, note: string) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', alertId, note })
      });
      if (res.ok) {
        fetchAlerts();
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to complete alert:', err);
    }
  };

  const handleSkipAlert = async (alertId: string, note: string) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip', alertId, note })
      });
      if (res.ok) {
        fetchAlerts();
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to skip alert:', err);
    }
  };

  // ── Ações de Campanhas ─────────────────────────────────────────────────────
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName) return;

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          flowSteps: campaignSteps
        })
      });
      if (res.ok) {
        setCampaignName('');
        setCampaignSteps([{ dayOffset: 1, channel: 'WHATSAPP', messageTemplate: 'Olá {{nome}}, tudo bem?' }]);
        setShowCampaignModal(false);
        fetchCampaigns();
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
    }
  };

  const handleAssignCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCampaignId || assignUserIds.length === 0 || selectedLeadIds.length === 0) return;

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          campaignId: assignCampaignId,
          externalPersonIds: selectedLeadIds,
          userIds: assignUserIds
        })
      });
      if (res.ok) {
        setSelectedLeadIds([]);
        setAssignCampaignId('');
        setAssignUserIds([]);
        setShowAssignModal(false);
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to assign campaign leads:', err);
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
          <button 
            onClick={() => setActiveTab('alerts')}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: activeTab === 'alerts' ? 'var(--accent-glow)' : 'transparent',
              color: activeTab === 'alerts' ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            🔔 Alert Center
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('campanhas')}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: activeTab === 'campanhas' ? 'var(--accent-glow)' : 'transparent',
                color: activeTab === 'campanhas' ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              🎯 Campanhas
            </button>
          )}
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
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('cancelados')}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: activeTab === 'cancelados' ? 'var(--accent-glow)' : 'transparent',
                color: activeTab === 'cancelados' ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              🚫 Cancelados
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
              {(() => {
                const filteredPlans = ((users?.usersByPlan || []) as any[]).filter(p => {
                  if (plansFilter === 'pagos') return p.price > 100;
                  if (plansFilter === 'cortesia') return p.price <= 100;
                  return true;
                });
                const totalFiltered = filteredPlans.length;
                const plansLimit = 10;
                const plansTotalPages = Math.ceil(totalFiltered / plansLimit);
                const paginatedPlans = filteredPlans.slice((plansPage - 1) * plansLimit, plansPage * plansLimit);

                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                      <div className="label">Quantidade de Assinantes por Plano</div>
                      <select
                        value={plansFilter}
                        onChange={(e) => {
                          setPlansFilter(e.target.value);
                          setPlansPage(1);
                        }}
                        style={{
                          background: 'var(--surface-raised)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="all">🌐 Geral (Todos)</option>
                        <option value="pagos">💵 Planos Pagos</option>
                        <option value="cortesia">🎁 Planos Cortesia</option>
                      </select>
                    </div>

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
                          {paginatedPlans.length === 0 ? (
                            <tr>
                              <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                                Nenhum plano encontrado correspondente ao filtro.
                              </td>
                            </tr>
                          ) : (
                            paginatedPlans.map((p, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.planTitle}</td>
                                <td>{formatBRL(p.price)}</td>
                                <td><span className="badge badge-neu">{p.intervalType}</span></td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>{p.subscriberCount}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {plansTotalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          Página {plansPage} de {plansTotalPages} ({totalFiltered} planos)
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            disabled={plansPage === 1}
                            onClick={() => setPlansPage(prev => Math.max(1, prev - 1))}
                            className="btn-action btn-action-outline"
                            style={{ padding: '6px 12px', fontSize: 12, opacity: plansPage === 1 ? 0.5 : 1, cursor: plansPage === 1 ? 'not-allowed' : 'pointer' }}
                          >
                            ◀️ Anterior
                          </button>
                          <button
                            disabled={plansPage === plansTotalPages}
                            onClick={() => setPlansPage(prev => Math.min(plansTotalPages, prev + 1))}
                            className="btn-action btn-action-outline"
                            style={{ padding: '6px 12px', fontSize: 12, opacity: plansPage === plansTotalPages ? 0.5 : 1, cursor: plansPage === plansTotalPages ? 'not-allowed' : 'pointer' }}
                          >
                            Próxima ▶️
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
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
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span>{lead.fullName}</span>
                              {lead.tag === 'CANCELED_CLIENT' && (
                                <span className="badge badge-down" style={{ fontSize: 9, padding: '2px 6px' }}>
                                  🚫 Cancelado
                                </span>
                              )}
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

          {/* Floating Action Bar for Selected Leads */}
          {isAdmin && selectedLeadIds.length > 0 && (
            <div style={{
              background: 'var(--accent-glow)', border: '1px solid var(--accent)', padding: '12px 20px',
              borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                🎯 {selectedLeadIds.length} leads selecionados para campanhas
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    setAssignCampaignId('');
                    setAssignUserIds([]);
                    setShowAssignModal(true);
                  }}
                  className="btn-action btn-action-purple"
                  style={{ fontSize: 12, padding: '6px 12px' }}
                >
                  🚀 Distribuir em Campanha
                </button>
                <button
                  onClick={() => setSelectedLeadIds([])}
                  className="btn-action btn-action-outline"
                  style={{ fontSize: 12, padding: '6px 12px' }}
                >
                  Limpar Seleção
                </button>
              </div>
            </div>
          )}

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
                    {isAdmin && (
                      <th style={{ width: 40, textAlign: 'center' }}>
                        <input 
                          type="checkbox"
                          checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeadIds(leads.map(l => l.id));
                            } else {
                              setSelectedLeadIds([]);
                            }
                          }}
                        />
                      </th>
                    )}
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
                          {isAdmin && (
                            <td style={{ textAlign: 'center' }}>
                              <input 
                                type="checkbox"
                                checked={selectedLeadIds.includes(lead.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedLeadIds([...selectedLeadIds, lead.id]);
                                  } else {
                                    setSelectedLeadIds(selectedLeadIds.filter(id => id !== lead.id));
                                  }
                                }}
                              />
                            </td>
                          )}
                          <td><span className="stat-mono" style={{ fontSize: 12 }}>{lead.createdAt.slice(0, 10)}</span></td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {lead.fullName}
                              {lead.tag === 'CANCELED_CLIENT' && (
                                <span className="badge badge-down" style={{ fontSize: 9, padding: '2px 6px' }}>
                                  🚫 Cancelado
                                </span>
                              )}
                            </div>
                          </td>
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

      {/* Aba de Cancelados (ADMIN Only) */}
      {activeTab === 'cancelados' && isAdmin && (
        <div className="card animate-fadeUp">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>🚫 Clientes Cancelados (Churn)</div>
              <div className="label-sm">Filtre cadastros de clientes com assinaturas canceladas, gerencie no CRM ou exporte relatórios.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button 
                onClick={() => {
                  let url = `/api/leads/canceled?format=csv`;
                  if (!canceledFilterAllMonths) url += `&month=${filterMonth}`;
                  if (filterPlan !== 'all') url += `&plan=${filterPlan}`;
                  if (filterSearch.trim() !== '') url += `&search=${encodeURIComponent(filterSearch)}`;
                  window.open(url, '_blank');
                }}
                className="btn-action btn-action-outline"
                style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                📥 Exportar CSV
              </button>
              <button 
                onClick={() => {
                  let url = `/dashboard/canceled/print?`;
                  if (!canceledFilterAllMonths) url += `month=${filterMonth}&`;
                  if (filterPlan !== 'all') url += `plan=${filterPlan}&`;
                  if (filterSearch.trim() !== '') url += `search=${encodeURIComponent(filterSearch)}`;
                  window.open(url, '_blank');
                }}
                className="btn-action btn-action-purple"
                style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                🖨️ Gerar PDF
              </button>
              <span className="badge badge-cyan">{canceledTotal} cancelados</span>
            </div>
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
              <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Plano Cancelado:</label>
              <select 
                value={filterPlan} 
                onChange={(e) => setFilterPlan(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
              >
                <option value="all">Todos os Planos</option>
                {users?.usersByPlan?.map((p: any) => (
                  <option key={p.planId} value={p.planId}>{p.planTitle}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Período:</label>
              <select 
                value={canceledFilterAllMonths ? 'all' : 'month'} 
                onChange={(e) => setCanceledFilterAllMonths(e.target.value === 'all')}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
              >
                <option value="month">Filtrar por Mês</option>
                <option value="all">Todos os Meses (Geral)</option>
              </select>
            </div>

            {!canceledFilterAllMonths && (
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Mês Cancelamento:</label>
                <MonthSelector currentMonth={filterMonth} />
              </div>
            )}
          </div>

          {/* Canceled Table Grid */}
          {loadingCanceled ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 20 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton" style={{ height: 40, width: '100%' }}></div>
              ))}
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Data Cancelamento</th>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Telefone</th>
                      <th>Plano Cancelado</th>
                      <th>Estágio CRM</th>
                      <th>Responsável</th>
                      <th style={{ textAlign: 'center' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {canceledData.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
                          Nenhum cliente cancelado encontrado.
                        </td>
                      </tr>
                    ) : (
                      canceledData.map((lead) => {
                        const waLink = formatWhatsappLink(lead.phoneNumber);
                        return (
                          <tr key={lead.id}>
                            <td>
                              <span className="stat-mono" style={{ fontSize: 12 }}>
                                {lead.canceledAt ? lead.canceledAt.slice(0, 10).split('-').reverse().join('/') : '-'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {lead.fullName}
                                <span className="badge badge-down" style={{ fontSize: 9, padding: '2px 6px' }}>
                                  🚫 Cancelado
                                </span>
                              </div>
                            </td>
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
                              <span style={{ color: 'var(--text-primary)' }}>
                                {lead.plan ? lead.plan.title : '-'}
                              </span>
                            </td>
                            <td>
                              <span 
                                className="badge" 
                                style={{ 
                                  background: `${STAGE_COLORS[lead.stage] || '#888'}1A`, 
                                  color: STAGE_COLORS[lead.stage] || '#888',
                                  border: `1px solid ${STAGE_COLORS[lead.stage] || '#888'}33`
                                }}
                              >
                                {STAGE_LABELS[lead.stage] || lead.stage}
                              </span>
                            </td>
                            <td>
                              <span style={{ color: lead.assignee ? 'var(--accent)' : 'var(--text-muted)', fontSize: 12 }}>
                                {lead.assignee ? lead.assignee.name : 'Não Atribuído'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button 
                                onClick={() => openFastAcquisition(lead, true)}
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

              {/* Pagination Controls */}
              {canceledTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: '10px 0' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                    Mostrando página <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{canceledPage}</span> de <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{canceledTotalPages}</span> ({canceledTotal} cancelados)
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      disabled={canceledPage === 1}
                      onClick={() => setCanceledPage(prev => Math.max(1, prev - 1))}
                      className="btn-action btn-action-outline"
                      style={{ padding: '6px 12px', fontSize: 12, opacity: canceledPage === 1 ? 0.5 : 1, cursor: canceledPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      ◀️ Anterior
                    </button>
                    {Array.from({ length: canceledTotalPages }, (_, idx) => idx + 1).map(p => {
                      if (canceledTotalPages > 5 && Math.abs(p - canceledPage) > 2 && p !== 1 && p !== canceledTotalPages) {
                        if (p === 2 || p === canceledTotalPages - 1) {
                          return <span key={p} style={{ alignSelf: 'center', color: 'var(--text-faint)', padding: '0 4px' }}>...</span>;
                        }
                        return null;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setCanceledPage(p)}
                          style={{
                            padding: '6px 10px',
                            fontSize: 12,
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                            background: canceledPage === p ? 'var(--accent)' : 'transparent',
                            color: canceledPage === p ? '#fff' : 'var(--text-primary)'
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      disabled={canceledPage === canceledTotalPages}
                      onClick={() => setCanceledPage(prev => Math.min(canceledTotalPages, prev + 1))}
                      className="btn-action btn-action-outline"
                      style={{ padding: '6px 12px', fontSize: 12, opacity: canceledPage === canceledTotalPages ? 0.5 : 1, cursor: canceledPage === canceledTotalPages ? 'not-allowed' : 'pointer' }}
                    >
                      Próxima ▶️
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Alert Center */}
      {activeTab === 'alerts' && (
        <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section: Task Alerts */}
          <div className="card">
            <div className="label" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                🔔 Tarefas Pendentes <span className="badge badge-down" style={{ fontSize: 11 }}>{alertsPagination.taskAlerts.total}</span>
              </div>
            </div>
            <p className="label-sm" style={{ marginBottom: 16 }}>Abaixo estão as réguas de comunicação ativas de suas campanhas que demandam contato hoje.</p>

            {loadingAlerts ? (
              <div className="skeleton" style={{ height: 100, width: '100%' }}></div>
            ) : alertsData.taskAlerts.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-faint)', border: '1px dashed var(--border)', borderRadius: 8 }}>
                Sem tarefas pendentes para hoje. Bom trabalho!
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                  {alertsData.taskAlerts.map((alert: any) => (
                    <div key={alert.id} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{alert.personName}</span>
                          <span className="badge badge-cyan" style={{ fontSize: 10 }}>{alert.taskType}</span>
                        </div>
                        <div className="label-sm" style={{ fontSize: 11, marginTop: 4 }}>{alert.personEmail} &middot; {alert.personPhone}</div>
                      </div>

                      {alert.renderedMessage && (
                        <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', borderLeft: '3px solid var(--accent)' }}>
                          "{alert.renderedMessage}"
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                        {alert.personPhone && (
                          <a 
                            href={formatWhatsappLink(alert.personPhone) || '#'}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-action btn-action-outline"
                            style={{ flex: 1, textAlign: 'center', fontSize: 11, padding: '8px 4px', textDecoration: 'none', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--green)', border: '1px solid var(--green)' }}
                          >
                            🟢 WhatsApp
                          </a>
                        )}
                        <button
                          onClick={() => {
                            const note = prompt('Alguma observação para a conclusão desta tarefa?');
                            if (note !== null) handleCompleteAlert(alert.id, note);
                          }}
                          className="btn-action btn-action-purple"
                          style={{ flex: 1, fontSize: 11, padding: '8px 4px' }}
                        >
                          ✅ Concluir
                        </button>
                        <button
                          onClick={() => {
                            const note = prompt('Por que deseja pular esta tarefa?');
                            if (note !== null) handleSkipAlert(alert.id, note);
                          }}
                          className="btn-action btn-action-outline"
                          style={{ fontSize: 11, padding: '8px 4px', color: 'var(--red)', border: '1px solid var(--red)' }}
                        >
                          Pular
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Task alerts pagination */}
                {alertsPagination.taskAlerts.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Mostrando página {taskPage} de {alertsPagination.taskAlerts.totalPages} (Total de {alertsPagination.taskAlerts.total} tarefas)
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        disabled={taskPage === 1}
                        onClick={() => setTaskPage(prev => Math.max(1, prev - 1))}
                        className="btn-action btn-action-outline"
                        style={{ padding: '6px 12px', fontSize: 12, opacity: taskPage === 1 ? 0.5 : 1, cursor: taskPage === 1 ? 'not-allowed' : 'pointer' }}
                      >
                        ◀️ Anterior
                      </button>
                      <button
                        disabled={taskPage === alertsPagination.taskAlerts.totalPages}
                        onClick={() => setTaskPage(prev => Math.min(alertsPagination.taskAlerts.totalPages, prev + 1))}
                        className="btn-action btn-action-outline"
                        style={{ padding: '6px 12px', fontSize: 12, opacity: taskPage === alertsPagination.taskAlerts.totalPages ? 0.5 : 1, cursor: taskPage === alertsPagination.taskAlerts.totalPages ? 'not-allowed' : 'pointer' }}
                      >
                        Próxima ▶️
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Section: Orphaned Leads */}
          <div className="card">
            <div className="label" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              🛒 Carrinhos Abandonados (Leads Livres) <span className="badge badge-cyan" style={{ fontSize: 11 }}>{alertsPagination.orphanedLeads.total}</span>
            </div>
            <p className="label-sm" style={{ marginBottom: 16 }}>Leads sem plano ativo e sem nenhum operador comercial atribuído. Assuma para atender.</p>

            {/* Selector for Month / All Months */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, background: 'var(--surface-raised)', padding: 12, borderRadius: 8 }}>
              <span className="label-sm" style={{ fontWeight: 600 }}>Período de Cadastro:</span>
              <select
                value={orphanMonth}
                onChange={(e) => {
                  setOrphanMonth(e.target.value);
                  setOrphanPage(1);
                }}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 13,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">Todos os Meses (Geral)</option>
                <option value="2026-07">Julho 2026</option>
                <option value="2026-06">Junho 2026</option>
                <option value="2026-05">Maio 2026</option>
                <option value="2026-04">Abril 2026</option>
                <option value="2026-03">Março 2026</option>
                <option value="2026-02">Fevereiro 2026</option>
                <option value="2026-01">Janeiro 2026</option>
              </select>
            </div>

            {loadingAlerts ? (
              <div className="skeleton" style={{ height: 100, width: '100%' }}></div>
            ) : alertsData.orphanedLeads.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-faint)', border: '1px dashed var(--border)', borderRadius: 8 }}>
                Sem oportunidades órfãs de carrinho abandonado no momento.
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Data Cadastro</th>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th style={{ textAlign: 'center' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertsData.orphanedLeads.map((lead: any) => (
                        <tr key={lead.id}>
                          <td>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</td>
                          <td>{lead.fullName}</td>
                          <td>{lead.email}</td>
                          <td>{lead.phoneNumber || 'Sem fone'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleClaimOrphaned(lead.id)}
                              className="btn-action btn-action-purple"
                              style={{ fontSize: 11, padding: '6px 12px' }}
                            >
                              ⚡ Atender Lead
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Orphaned leads pagination */}
                {alertsPagination.orphanedLeads.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Mostrando página {orphanPage} de {alertsPagination.orphanedLeads.totalPages} (Total de {alertsPagination.orphanedLeads.total} carrinhos)
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        disabled={orphanPage === 1}
                        onClick={() => setOrphanPage(prev => Math.max(1, prev - 1))}
                        className="btn-action btn-action-outline"
                        style={{ padding: '6px 12px', fontSize: 12, opacity: orphanPage === 1 ? 0.5 : 1, cursor: orphanPage === 1 ? 'not-allowed' : 'pointer' }}
                      >
                        ◀️ Anterior
                      </button>
                      <button
                        disabled={orphanPage === alertsPagination.orphanedLeads.totalPages}
                        onClick={() => setOrphanPage(prev => Math.min(alertsPagination.orphanedLeads.totalPages, prev + 1))}
                        className="btn-action btn-action-outline"
                        style={{ padding: '6px 12px', fontSize: 12, opacity: orphanPage === alertsPagination.orphanedLeads.totalPages ? 0.5 : 1, cursor: orphanPage === alertsPagination.orphanedLeads.totalPages ? 'not-allowed' : 'pointer' }}
                      >
                        Próxima ▶️
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Section: Expiring Leads */}
          <div className="card">
            <div className="label" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⏳ Planos a Vencer (Expiração Próxima) <span className="badge badge-down" style={{ fontSize: 11 }}>{alertsPagination.expiringLeads.total}</span>
            </div>
            <p className="label-sm" style={{ marginBottom: 16 }}>Assinaturas ativas prestes a vencer nos próximos 30 dias e que estão sem operador. Assuma para renovar.</p>

            {loadingAlerts ? (
              <div className="skeleton" style={{ height: 100, width: '100%' }}></div>
            ) : alertsData.expiringLeads.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-faint)', border: '1px dashed var(--border)', borderRadius: 8 }}>
                Nenhuma assinatura próxima da expiração sem operador no momento.
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Vence em</th>
                        <th>Cliente</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>Plano Atual</th>
                        <th style={{ textAlign: 'center' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertsData.expiringLeads.map((lead: any) => (
                        <tr key={lead.id}>
                          <td style={{ fontWeight: 'bold', color: 'var(--red)' }}>
                            {new Date(lead.expiresIn).toLocaleDateString('pt-BR')}
                          </td>
                          <td>{lead.fullName}</td>
                          <td>{lead.email}</td>
                          <td>{lead.phoneNumber || 'Sem fone'}</td>
                          <td>{lead.planTitle}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleClaimOrphaned(lead.id)}
                              className="btn-action btn-action-purple"
                              style={{ fontSize: 11, padding: '6px 12px' }}
                            >
                              ⚡ Atender Lead
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Expiring leads pagination */}
                {alertsPagination.expiringLeads.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Mostrando página {expiringPage} de {alertsPagination.expiringLeads.totalPages} (Total de {alertsPagination.expiringLeads.total} assinaturas)
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        disabled={expiringPage === 1}
                        onClick={() => setExpiringPage(prev => Math.max(1, prev - 1))}
                        className="btn-action btn-action-outline"
                        style={{ padding: '6px 12px', fontSize: 12, opacity: expiringPage === 1 ? 0.5 : 1, cursor: expiringPage === 1 ? 'not-allowed' : 'pointer' }}
                      >
                        ◀️ Anterior
                      </button>
                      <button
                        disabled={expiringPage === alertsPagination.expiringLeads.totalPages}
                        onClick={() => setExpiringPage(prev => Math.min(alertsPagination.expiringLeads.totalPages, prev + 1))}
                        className="btn-action btn-action-outline"
                        style={{ padding: '6px 12px', fontSize: 12, opacity: expiringPage === alertsPagination.expiringLeads.totalPages ? 0.5 : 1, cursor: expiringPage === alertsPagination.expiringLeads.totalPages ? 'not-allowed' : 'pointer' }}
                      >
                        Próxima ▶️
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab: Campaigns and KPIs */}
      {activeTab === 'campanhas' && isAdmin && (
        <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header & Campaign Creation */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 className="label">🎯 Campanhas Ativas & Regras</h3>
                <p className="label-sm">Crie campanhas, monte sequências de régua de comunicação e acompanhe a distribuição automática.</p>
              </div>
              <button 
                onClick={() => {
                  setCampaignName('');
                  setCampaignSteps([{ dayOffset: 1, channel: 'WHATSAPP', messageTemplate: 'Olá {{nome}}, tudo bem?' }]);
                  setShowCampaignModal(true);
                }} 
                className="btn-action btn-action-purple"
              >
                ➕ Nova Campanha
              </button>
            </div>

            {loadingCampaigns ? (
              <div className="skeleton" style={{ height: 80, width: '100%', marginTop: 16 }}></div>
            ) : campaignsData.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-faint)', border: '1px dashed var(--border)', borderRadius: 8, marginTop: 16 }}>
                Nenhuma campanha configurada. Clique em "Nova Campanha" para começar.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
                {campaignsData.map((campaign: any) => (
                  <div key={campaign.id} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{campaign.name}</span>
                      <span className="badge badge-cyan" style={{ fontSize: 9 }}>{campaign.status}</span>
                    </div>
                    <div className="label-sm" style={{ fontSize: 11, marginBottom: 12 }}>
                      Criada em: {new Date(campaign.createdAt).toLocaleDateString('pt-BR')} &bull; {campaign._count?.leads || 0} leads vinculados
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      <strong>Passos da Régua:</strong>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        {campaign.flowSteps?.map((step: any) => (
                          <li key={step.id}>Dia {step.dayOffset}: {step.channel}</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => setSelectedKpiCampaignId(campaign.id)}
                      className="btn-action btn-action-outline"
                      style={{ width: '100%', fontSize: 11, padding: '6px' }}
                    >
                      📊 Ver KPIs da Campanha
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: KPI Panel */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <h3 className="label">📊 BI & KPIs da Equipe</h3>
                <p className="label-sm">Acompanhe as taxas de conversão (Win Rate), SLA de atendimento e produtividade da equipe comercial.</p>
              </div>
              <div>
                <select
                  value={selectedKpiCampaignId}
                  onChange={(e) => setSelectedKpiCampaignId(e.target.value)}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
                >
                  <option value="">Todas as Campanhas (Geral)</option>
                  {campaignsData.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingKpis ? (
              <div className="skeleton" style={{ height: 150, width: '100%' }}></div>
            ) : !kpiData ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-faint)' }}>Erro ao carregar os dados de KPI.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Metric Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  <div className="stat-card" style={{ padding: 16, background: 'var(--surface-raised)' }}>
                    <div className="label-sm">Total de Leads</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0' }}>{kpiData.summary.totalLeads}</div>
                    <div className="label-sm" style={{ color: 'var(--text-faint)' }}>Vinculados à campanha</div>
                  </div>
                  <div className="stat-card" style={{ padding: 16, background: 'var(--surface-raised)' }}>
                    <div className="label-sm">Atendidos</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', margin: '6px 0' }}>{kpiData.summary.attendedLeads}</div>
                    <div className="label-sm" style={{ color: 'var(--text-faint)' }}>Tiveram contato</div>
                  </div>
                  <div className="stat-card" style={{ padding: 16, background: 'var(--surface-raised)' }}>
                    <div className="label-sm">Convertidos (Ganhos)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green)', margin: '6px 0' }}>{kpiData.summary.convertedLeads}</div>
                    <div className="label-sm" style={{ color: 'var(--text-faint)' }}>Win Rate: {kpiData.summary.winRate.toFixed(1)}%</div>
                  </div>
                  <div className="stat-card" style={{ padding: 16, background: 'var(--surface-raised)' }}>
                    <div className="label-sm">Perdidos</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--red)', margin: '6px 0' }}>{kpiData.summary.lostLeads}</div>
                    <div className="label-sm" style={{ color: 'var(--text-faint)' }}>Descartados pelo time</div>
                  </div>
                  <div className="stat-card" style={{ padding: 16, background: 'var(--surface-raised)' }}>
                    <div className="label-sm">SLA Médio Equipe</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', margin: '6px 0' }}>{kpiData.summary.globalAvgSlaHours.toFixed(1)}h</div>
                    <div className="label-sm" style={{ color: 'var(--text-faint)' }}>Tempo até 1ª resposta</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 12 }}>
                  {/* Ranking of Conversions */}
                  <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 12 }}>🏆 Ranking de Conversões (Vendedores)</div>
                    {kpiData.userRanking.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-faint)', padding: 10 }}>Nenhuma conversão registrada.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {kpiData.userRanking.map((ur: any, idx: number) => (
                          <div key={ur.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                            <span>{idx + 1}. {ur.userName}</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--green)' }}>{ur.conversions} vendas</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SLA Response Time Ranking */}
                  <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 12 }}>⚡ SLA de Atendimento (Mais Rápidos)</div>
                    {kpiData.userSlaRanking.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-faint)', padding: 10 }}>Sem dados de SLA disponíveis.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {kpiData.userSlaRanking.map((usr: any, idx: number) => (
                          <div key={usr.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                            <span>{idx + 1}. {usr.userName}</span>
                            <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{usr.avgSlaHours.toFixed(1)} horas</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Objections Distribution */}
                  <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 12 }}>🚨 Motivos de Perda (Objeções)</div>
                    {kpiData.lostReasonsDistribution.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-faint)', padding: 10 }}>Sem descartes na campanha selecionada.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {kpiData.lostReasonsDistribution.map((lrd: any) => {
                          const labelMap: Record<string, string> = {
                            PRICE_TOO_HIGH: 'Preço Elevado',
                            GHOSTING: 'Não respondeu / Sem contato',
                            MISSING_CONTENT: 'Falta de conteúdo relevante',
                            UNQUALIFIED: 'Não qualificado / Sem perfil'
                          };
                          return (
                            <div key={lrd.reason} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                              <span>{labelMap[lrd.reason] || lrd.reason}</span>
                              <span style={{ fontWeight: 'bold', color: 'var(--red)' }}>{lrd.count} descartes</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
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
                {!showLossReasons && !showScheduler ? (
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
                      onClick={() => setShowScheduler(true)}
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
                ) : showScheduler ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA' }}>Escolha a Data/Hora do Retorno:</span>
                      <button 
                        onClick={() => { setShowScheduler(false); setScheduledDate(''); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Voltar
                      </button>
                    </div>
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      required
                      onChange={(e) => setScheduledDate(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => handleActionDisposition('MEETING_SCHEDULED', undefined, scheduledDate)}
                      disabled={!scheduledDate}
                      style={{
                        width: '100%', padding: '8px 12px', background: scheduledDate ? '#60A5FA' : 'var(--border)',
                        color: scheduledDate ? '#000' : 'var(--text-muted)', border: 'none', borderRadius: 8,
                        fontSize: 12, fontWeight: 700, cursor: scheduledDate ? 'pointer' : 'not-allowed', transition: 'all 0.2s'
                      }}
                    >
                      📅 Confirmar Retorno
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
                <button
                  type="button"
                  onClick={() => openFreezeModal(selectedLead)}
                  style={{
                    width: '100%', marginTop: 12, padding: '8px 12px', background: 'transparent',
                    border: '1px solid #0284c7', borderRadius: 8, color: '#0284c7', fontSize: 12,
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#0284c7'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0284c7'; }}
                >
                  ❄️ Congelar Atendimento
                </button>
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

      {/* ====================================================================== */}
      {/* MODAL 4: Congelamento de Lead */}
      {/* ====================================================================== */}
      {showFreezeModal && selectedLead && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', background: 'var(--surface)', padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>
                ❄️ Congelar Atendimento
              </h3>
              <button 
                onClick={() => { setShowFreezeModal(false); setShowTimelineModal(true); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFreezeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Congelar até:</label>
                <input 
                  type="date" 
                  required
                  value={freezeUntil} 
                  onChange={(e) => setFreezeUntil(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13
                  }}
                />
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Justificativa / Motivo:</label>
                <textarea 
                  required
                  value={freezeReason} 
                  onChange={(e) => setFreezeReason(e.target.value)}
                  placeholder="Por que o atendimento está sendo congelado? Ex: Cliente viaja e pediu retorno dia X."
                  style={{
                    width: '100%', height: 80, padding: '10px 14px', background: 'var(--surface-raised)',
                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', resize: 'none', fontSize: 13
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button 
                  type="button" 
                  onClick={() => { setShowFreezeModal(false); setShowTimelineModal(true); }} 
                  className="btn-action btn-action-outline"
                  style={{ padding: '8px 16px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-action btn-action-purple"
                  style={{ padding: '8px 16px', background: '#0284c7', borderColor: '#0284c7' }}
                >
                  ❄️ Confirmar Congelamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 5: Nova Campanha e Réguas */}
      {/* ====================================================================== */}
      {showCampaignModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '550px', background: 'var(--surface)', padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>
                🎯 Criar Nova Campanha
              </h3>
              <button 
                onClick={() => setShowCampaignModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Nome da Campanha:</label>
                <input 
                  type="text" 
                  required
                  value={campaignName} 
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Ex: Campanha Resgate Congresso DentalPress"
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13
                  }}
                />
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>
                  Régua de Comunicação (Flow Steps):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {campaignSteps.map((step, index) => (
                    <div key={index} style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8, background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <label className="label-sm" style={{ fontSize: 10 }}>Dia Offset:</label>
                          <input 
                            type="number" 
                            min="0"
                            required
                            value={step.dayOffset}
                            onChange={(e) => {
                              const copy = [...campaignSteps];
                              copy[index].dayOffset = Number(e.target.value);
                              setCampaignSteps(copy);
                            }}
                            style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                          />
                        </div>
                        <div style={{ flex: 2 }}>
                          <label className="label-sm" style={{ fontSize: 10 }}>Canal:</label>
                          <select 
                            value={step.channel}
                            onChange={(e) => {
                              const copy = [...campaignSteps];
                              copy[index].channel = e.target.value;
                              setCampaignSteps(copy);
                            }}
                            style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                          >
                            <option value="WHATSAPP">💬 WhatsApp</option>
                            <option value="EMAIL">📧 E-mail</option>
                            <option value="CALL">📞 Ligação</option>
                          </select>
                        </div>
                        {campaignSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCampaignSteps(campaignSteps.filter((_, idx) => idx !== index))}
                            style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 16, cursor: 'pointer', marginTop: 16 }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="label-sm" style={{ fontSize: 10 }}>Template da Mensagem:</label>
                        <textarea
                          value={step.messageTemplate}
                          onChange={(e) => {
                            const copy = [...campaignSteps];
                            copy[index].messageTemplate = e.target.value;
                            setCampaignSteps(copy);
                          }}
                          placeholder="Olá {{nome}}, tudo bem? Notei que você..."
                          style={{ width: '100%', height: 50, padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, resize: 'none', outline: 'none' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setCampaignSteps([...campaignSteps, { dayOffset: campaignSteps[campaignSteps.length - 1].dayOffset + 2, channel: 'WHATSAPP', messageTemplate: '' }])}
                  className="btn-action btn-action-outline"
                  style={{ width: '100%', marginTop: 12, fontSize: 12, padding: '8px' }}
                >
                  ➕ Adicionar Passo na Régua
                </button>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button 
                  type="button" 
                  onClick={() => setShowCampaignModal(false)} 
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
                  Criar Campanha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 6: Atribuição / Rodízio de Campanhas */}
      {/* ====================================================================== */}
      {showAssignModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', background: 'var(--surface)', padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>
                🎯 Distribuir Leads em Campanha
              </h3>
              <button 
                onClick={() => setShowAssignModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAssignCampaign} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, background: 'var(--accent-glow)', color: 'var(--accent)', padding: 12, borderRadius: 8, fontWeight: 600 }}>
                Total de leads selecionados: {selectedLeadIds.length}
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Selecionar Campanha Alvo:</label>
                <select 
                  required
                  value={assignCampaignId} 
                  onChange={(e) => setAssignCampaignId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
                >
                  <option value="">-- Selecione a Campanha --</option>
                  {campaignsData.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>
                  Selecionar Operadores para Rodízio (Round Robin):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', padding: 12, borderRadius: 8, background: 'var(--surface-raised)' }}>
                  {teamList.map(u => (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox"
                        checked={assignUserIds.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignUserIds([...assignUserIds, u.id]);
                          } else {
                            setAssignUserIds(assignUserIds.filter(id => id !== u.id));
                          }
                        }}
                      />
                      {u.name}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button 
                  type="button" 
                  onClick={() => setShowAssignModal(false)} 
                  className="btn-action btn-action-outline"
                  style={{ padding: '8px 16px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={!assignCampaignId || assignUserIds.length === 0}
                  className="btn-action btn-action-purple"
                  style={{ padding: '8px 16px' }}
                >
                  🚀 Distribuir & Atribuir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
