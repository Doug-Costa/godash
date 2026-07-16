'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { ReactFlow, MiniMap, Controls, Background, Panel, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import KpiCard from '@/components/ui/KpiCard';
import GrowthTrendChart from '@/components/charts/GrowthTrendChart';
import ChurnChart from '@/components/charts/ChurnChart';
import PlanDistributionChart from '@/components/charts/PlanDistributionChart';
import CohortTable from '@/components/charts/CohortTable';
import ThemeToggle from '@/components/ThemeToggle';
import MonthSelector from '@/components/ui/MonthSelector';
import Timeline from '@/components/ui/Timeline';

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
  pipelines?: Array<{ id: string; name: string; description: string | null; stages?: any[] }>;
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
  pipelines = [],
}: DashboardContentProps) {
  const isAdmin = currentUser?.role === 'ADMIN';

  // State Management
  const [activeTab, setActiveTab] = useState<'financeiro' | 'kanban' | 'leads' | 'team' | 'cancelados' | 'alerts' | 'campanhas' | 'atendimento'>(
    isAdmin ? 'financeiro' : 'atendimento'
  );

  const [atendimentoViewMode, setAtendimentoViewMode] = useState<'kanban' | 'list'>('kanban');
  const [atendimentoFila, setAtendimentoFila] = useState<'campanhas' | 'alerts' | 'cancelados' | 'expirar' | 'abandonados'>('campanhas');
  const [filaCounts, setFilaCounts] = useState({ campanhas: 0, alerts: 0, cancelados: 0, expirar: 0, abandonados: 0 });
  
  const defaultPipeline = pipelines.find(p => p.name === 'Vendas') || pipelines[0];
  const [activePipelineId, setActivePipelineId] = useState<string>(defaultPipeline?.id || '');
  
  // Leads data state (loaded dynamically for Kanban & Leads Table)
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsLimit, setLeadsLimit] = useState(10);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsTotalPages, setLeadsTotalPages] = useState(1);

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

  // Dynamic metadata states
  const [metaInstagram, setMetaInstagram] = useState('');
  const [metaSpecialty, setMetaSpecialty] = useState('');
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);
  const [isEditingInst, setIsEditingInst] = useState(false);

  // RapidFire States
  const [activeRapidFireTab, setActiveRapidFireTab] = useState<'whatsapp' | 'email' | 'voip' | null>(null);
  const [waPasteText, setWaPasteText] = useState('');
  const [emailSubject, setEmailSubject] = useState('DentalGO - Atendimento Comercial');
  const [emailBodyText, setEmailBodyText] = useState('');
  const [isSendingRapidFire, setIsSendingRapidFire] = useState(false);

  // Funnel exit lostReason state variables
  const [showLossReasonSelection, setShowLossReasonSelection] = useState(false);
  const [lossTargetLeadId, setLossTargetLeadId] = useState<number | null>(null);
  const [lossTargetJourneyId, setLossTargetJourneyId] = useState<string | null>(null);
  const [lossTargetStage, setLossTargetStage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedLead) {
      const meta = selectedLead.metadata || {};
      setMetaInstagram(meta.instagram || '');
      setMetaSpecialty(meta.specialty || '');
      setActiveRapidFireTab(null);
      setWaPasteText('');
      setEmailSubject('DentalGO - Atendimento Comercial');
      setEmailBodyText('');
    } else {
      setMetaInstagram('');
      setMetaSpecialty('');
      setActiveRapidFireTab(null);
    }
  }, [selectedLead]);

  // Team management state
  const [teamList, setTeamList] = useState(agents);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [agentForm, setAgentForm] = useState({ name: '', email: '', password: '', role: 'AGENT', isActive: true });
  const [agentError, setAgentError] = useState<string | null>(null);

  // Administration Settings states
  const [settingsForm, setSettingsForm] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
    voipProvider: 'twilio',
    voipApiKey: '',
    voipAccountSid: '',
    voipLineNumber: '',
    whatsappUrl: '',
    whatsappApiKey: '',
    whatsappInstance: ''
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedFeedback, setSettingsSavedFeedback] = useState(false);

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

  // Estados do Wizard de Campanhas
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [campaignPlansFilter, setCampaignPlansFilter] = useState<'all' | 'pagos' | 'cortesia'>('all');
  const [plansList, setPlansList] = useState<any[]>([]);
  const [campaignSelectedPlans, setCampaignSelectedPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<'active' | 'canceled' | 'expired'>('active');
  const [campaignExpiryDays, setCampaignExpiryDays] = useState<string>('30');
  const [campaignStartDate, setCampaignStartDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [estimatedAudience, setEstimatedAudience] = useState<number>(0);
  const [loadingEstimate, setLoadingEstimate] = useState<boolean>(false);
  const [campaignAgentIds, setCampaignAgentIds] = useState<string[]>([]);
  const [campaignLimitPerDay, setCampaignLimitPerDay] = useState<string>('');
  const [campaignLimitEnabled, setCampaignLimitEnabled] = useState<boolean>(false);
  const [campaignSmtpConfigId, setCampaignSmtpConfigId] = useState('');
  const [excludeNurturing, setExcludeNurturing] = useState(true);
  const [campaignOnWinJourneyId, setCampaignOnWinJourneyId] = useState('');
  const [campaignOnLoseJourneyId, setCampaignOnLoseJourneyId] = useState('');
  const [campaignPipelineId, setCampaignPipelineId] = useState('');

  // Estados para SMTP e Templates (DentalGO CRM 360)
  const [smtpConfigs, setSmtpConfigs] = useState<any[]>([]);
  const [loadingSmtps, setLoadingSmtps] = useState(false);
  const [smtpId, setSmtpId] = useState('');
  const [smtpName, setSmtpName] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<string | null>(null);
  const [smtpTesting, setSmtpTesting] = useState(false);

  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [tplId, setTplId] = useState('');
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplType, setTplType] = useState('EMAIL'); // EMAIL | WHATSAPP
  const [tplLang, setTplLang] = useState('PT'); // PT | EN | ES
  const [tplSubject, setTplSubject] = useState('');
  const [tplContent, setTplContent] = useState('');

  // Estados do React Flow para a régua
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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

  // Filtro de período do Kanban
  const [kanbanFilterAllMonths, setKanbanFilterAllMonths] = useState(false);

  // Filtro de Campanha na aba Atendimento
  const [filterCampaignId, setFilterCampaignId] = useState('all');

  // Load leads based on current filters
  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const monthParam = (activeTab === 'kanban' && kanbanFilterAllMonths) ? 'all' : filterMonth;
      
      const useLimit = atendimentoViewMode === 'kanban' ? 1000 : leadsLimit;
      const usePage = atendimentoViewMode === 'kanban' ? 1 : leadsPage;

      let url = `/api/leads?month=${monthParam}&page=${usePage}&limit=${useLimit}`;
      if (filterPlan !== 'all') url += `&plan=${filterPlan}`;
      if (filterSearch.trim() !== '') url += `&search=${encodeURIComponent(filterSearch)}`;
      if (filterStage !== '') url += `&stage=${filterStage}`;
      if (filterAssignee !== 'all') url += `&assigneeId=${filterAssignee}`;
      if (activePipelineId !== '') url += `&pipelineId=${activePipelineId}`;
      if (activeTab === 'atendimento') {
        url += `&atendimentoFila=${atendimentoFila}`;
        if (filterCampaignId !== 'all') {
          url += `&campaignId=${filterCampaignId}`;
        }
      }

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setLeads(json.data || []);
        if (json.pagination) {
          setLeadsTotal(json.pagination.total || 0);
          setLeadsTotalPages(json.pagination.totalPages || 1);
        }
        if (activeTab === 'atendimento') {
          fetchFilaCounts();
        }
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const [isSyncingCRM, setIsSyncingCRM] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncCRM = async () => {
    setIsSyncingCRM(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/leads/sync', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSyncFeedback(`✓ Sincronizado: ${json.data.abandonedCount} abandonos, ${json.data.expiringCount} expirações.`);
          fetchLeads();
        } else {
          setSyncFeedback(`❌ Falha: ${json.error || 'Erro desconhecido'}`);
        }
      } else {
        setSyncFeedback(`❌ Erro no servidor: ${res.statusText}`);
      }
    } catch (err: any) {
      setSyncFeedback(`❌ Erro: ${err.message}`);
    } finally {
      setIsSyncingCRM(false);
    }
  };

  const fetchFilaCounts = async () => {
    try {
      const monthParam = (activeTab === 'kanban' && kanbanFilterAllMonths) ? 'all' : filterMonth;
      let url = `/api/leads/counts?month=${monthParam}`;
      if (filterCampaignId !== 'all') {
        url += `&campaignId=${filterCampaignId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setFilaCounts(json.data);
        }
      }
    } catch (err) {
      console.error('Error fetching fila counts:', err);
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
    if (activeTab === 'atendimento') {
      fetchFilaCounts();
      fetchCampaigns();
    }
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
    if (activeTab === 'team') {
      fetchSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPlan, filterSearch, filterStage, filterAssignee, filterMonth, filterCampaignId, canceledFilterAllMonths, kanbanFilterAllMonths, activeTab, selectedKpiCampaignId, activePipelineId, leadsPage, leadsLimit, atendimentoFila, atendimentoViewMode]);

  useEffect(() => {
    if (activeTab !== 'atendimento' && filterMonth === 'all') {
      const currentMonthStr = new Date().toISOString().slice(0, 7);
      setFilterMonth(currentMonthStr);
      const params = new URLSearchParams(window.location.search);
      params.set('month', currentMonthStr);
      window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  }, [activeTab, filterMonth]);

  useEffect(() => {
    setLeadsPage(1);
  }, [filterPlan, filterSearch, filterStage, filterAssignee, filterMonth, filterCampaignId, activeTab, atendimentoFila, atendimentoViewMode]);

  // Fetch plans list when campaign modal is open
  useEffect(() => {
    if (showCampaignModal && plansList.length === 0) {
      const fetchPlans = async () => {
        setLoadingPlans(true);
        try {
          const res = await fetch('/api/plans');
          if (res.ok) {
            const data = await res.json();
            setPlansList(data.data || []);
          }
        } catch (err) {
          console.error('Failed to fetch plans list:', err);
        } finally {
          setLoadingPlans(false);
        }
      };
      fetchPlans();
    }
  }, [showCampaignModal, plansList.length]);

  // Reset selected plans when plans filter category changes
  useEffect(() => {
    setCampaignSelectedPlans([]);
  }, [campaignPlansFilter]);

  // Fetch estimated audience for campaign wizard (debounced)
  useEffect(() => {
    if (!showCampaignModal) return;
    
    const delayDebounceFn = setTimeout(async () => {
      setLoadingEstimate(true);
      try {
        const res = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'estimate',
            plansFilter: campaignPlansFilter,
            selectedPlans: campaignSelectedPlans,
            statusFilter: campaignStatusFilter,
            expiryDays: campaignStatusFilter === 'expired' ? Number(campaignExpiryDays) : undefined,
            excludeNurturing: excludeNurturing
          })
        });
        if (res.ok) {
          const data = await res.json();
          setEstimatedAudience(data.count || 0);
        }
      } catch (err) {
        console.error('Failed to estimate audience:', err);
      } finally {
        setLoadingEstimate(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [campaignPlansFilter, campaignSelectedPlans, campaignStatusFilter, campaignExpiryDays, excludeNurturing, showCampaignModal]);

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
  const handleDragStart = (e: React.DragEvent, leadId: number, journeyId: string | null = null) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ leadId, journeyId }));
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const dragDataStr = e.dataTransfer.getData('text/plain');
    if (!dragDataStr) return;
    
    let leadId: number;
    let journeyId: string | null = null;
    try {
      const data = JSON.parse(dragDataStr);
      leadId = data.leadId;
      journeyId = data.journeyId;
    } catch {
      leadId = Number(dragDataStr);
    }

    if (targetStage === 'perdido') {
      setLossTargetLeadId(leadId);
      setLossTargetJourneyId(journeyId);
      setLossTargetStage('perdido');
      setShowLossReasonSelection(true);
      return;
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, journeyId, stage: targetStage }),
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
    if (fastStage === 'perdido') {
      setLossTargetLeadId(selectedLead.id);
      setLossTargetJourneyId(selectedLead.journeyId || null);
      setLossTargetStage('perdido');
      setShowLossReasonSelection(true);
      setShowFastAcquisitionModal(false);
      return;
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          journeyId: selectedLead.journeyId || null,
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

  const handleDetailUpdate = async (field: 'stage' | 'assigneeId', value: string) => {
    if (field === 'stage' && value === 'perdido') {
      setLossTargetLeadId(selectedLead.id);
      setLossTargetJourneyId(selectedLead.journeyId || null);
      setLossTargetStage('perdido');
      setShowLossReasonSelection(true);
      setShowTimelineModal(false);
      return;
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          journeyId: selectedLead.journeyId || null,
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
          journeyId: selectedLead.journeyId || null,
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

  const handleSaveMetadata = async (inst?: string, spec?: string) => {
    if (!selectedLead) return;
    setIsSavingMeta(true);
    const targetInst = inst !== undefined ? inst : metaInstagram;
    const targetSpec = spec !== undefined ? spec : metaSpecialty;
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          metadata: {
            instagram: targetInst,
            specialty: targetSpec,
          }
        })
      });
      if (res.ok) {
        const json = await res.json();
        setSelectedLead((prev: any) => ({
          ...prev,
          metadata: json.data.metadata
        }));
        setMetaSaved(true);
        setTimeout(() => setMetaSaved(false), 3000);
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to save metadata:', err);
    } finally {
      setIsSavingMeta(false);
    }
  };

  const fetchSmtpConfigs = async () => {
    setLoadingSmtps(true);
    try {
      const res = await fetch('/api/settings/smtp');
      if (res.ok) {
        const json = await res.json();
        setSmtpConfigs(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching SMTP configs:', err);
    } finally {
      setLoadingSmtps(false);
    }
  };

  const fetchTemplatesList = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/settings/templates');
      if (res.ok) {
        const json = await res.json();
        setTemplatesList(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setSettingsForm(json.data);
        }
      }
      await Promise.all([fetchSmtpConfigs(), fetchTemplatesList()]);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: smtpId || undefined,
          name: smtpName,
          host: smtpHost,
          port: Number(smtpPort),
          user: smtpUser,
          pass: smtpPass,
          secure: smtpSecure
        })
      });
      if (res.ok) {
        setSmtpId('');
        setSmtpName('');
        setSmtpHost('');
        setSmtpPort('587');
        setSmtpUser('');
        setSmtpPass('');
        setSmtpSecure(false);
        setSmtpTestResult(null);
        fetchSmtpConfigs();
      } else {
        const json = await res.json();
        alert(json.error || 'Erro ao salvar SMTP.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestSmtp = async () => {
    setSmtpTesting(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          id: smtpId || undefined,
          host: smtpHost,
          port: Number(smtpPort),
          user: smtpUser,
          pass: smtpPass,
          secure: smtpSecure
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSmtpTestResult('🟢 Conexão bem-sucedida!');
      } else {
        setSmtpTestResult(`🔴 Falha: ${json.error}`);
      }
    } catch (err: any) {
      setSmtpTestResult(`🔴 Erro na requisição: ${err.message}`);
    } finally {
      setSmtpTesting(false);
    }
  };

  const handleActivateSmtp = async (id: string) => {
    try {
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', id })
      });
      if (res.ok) {
        fetchSmtpConfigs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSmtp = async (id: string) => {
    if (!confirm('Deseja excluir esta configuração SMTP?')) return;
    try {
      const res = await fetch(`/api/settings/smtp?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSmtpConfigs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tplId || undefined,
          name: tplName,
          description: tplDesc,
          type: tplType,
          language: tplLang,
          subject: tplType === 'EMAIL' ? tplSubject : undefined,
          content: tplContent
        })
      });
      if (res.ok) {
        setTplId('');
        setTplName('');
        setTplDesc('');
        setTplType('EMAIL');
        setTplLang('PT');
        setTplSubject('');
        setTplContent('');
        fetchTemplatesList();
      } else {
        const json = await res.json();
        alert(json.error || 'Erro ao salvar template.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Deseja excluir este template?')) return;
    try {
      const res = await fetch(`/api/settings/templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTemplatesList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        setSettingsSavedFeedback(true);
        setTimeout(() => setSettingsSavedFeedback(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleConfirmLoss = async (reason: string) => {
    if (!lossTargetLeadId) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lossTargetLeadId,
          journeyId: lossTargetJourneyId,
          stage: 'perdido',
          type: 'LOST',
          lossReason: reason,
          lostReason: reason,
          note: `Estágio comercial atualizado para Perdido. Motivo: ${reason}`,
        }),
      });

      if (res.ok) {
        setShowLossReasonSelection(false);
        setLossTargetLeadId(null);
        setLossTargetJourneyId(null);
        setLossTargetStage(null);
        fetchLeads();
        if (activeTab === 'cancelados') {
          fetchCanceledLeads();
        }
      }
    } catch (err) {
      console.error('Failed to confirm loss status:', err);
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

  const handleAtenderAlert = async (alert: any) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'atender', alertId: alert.id })
      });
      if (res.ok) {
        const leadId = alert.leadState.externalPersonId;
        const leadRes = await fetch(`/api/leads?leadId=${leadId}`);
        if (leadRes.ok) {
          const leadJson = await leadRes.json();
          if (leadJson.success && leadJson.data.length > 0) {
            openTimeline(leadJson.data[0]);
          }
        }
        fetchAlerts();
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to atender alert:', err);
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

  const handleAddFlowStep = (channel: 'WHATSAPP' | 'CALL' | 'EMAIL') => {
    const id = String(Date.now());
    const emoji = channel === 'WHATSAPP' ? '💬' : channel === 'CALL' ? '📞' : '📧';
    
    // Obter o último nó para posicionar abaixo
    const lastNode = nodes[nodes.length - 1];
    const lastY = lastNode ? lastNode.position.y : 50;
    const newY = lastY + 80;
    
    const newNode = {
      id,
      data: { 
        label: `${emoji} ${channel} (Dia ${nodes.length})`, 
        channel, 
        dayOffset: nodes.length, 
        messageTemplate: '' 
      },
      position: { x: 200, y: newY },
      style: {
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 10,
        width: 180,
        textAlign: 'center' as const
      }
    };
    
    setNodes(prev => [...prev, newNode]);
    
    if (lastNode) {
      const newEdge = {
        id: `e-${lastNode.id}-${id}`,
        source: lastNode.id,
        target: id,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed }
      };
      setEdges(prev => [...prev, newEdge]);
    }
    
    setSelectedNodeId(id);
  };

  const handleLaunchCampaignSubmit = async () => {
    if (nodes.length <= 1) {
      alert('Por favor, adicione pelo menos um passo de ação na sua régua.');
      return;
    }

    try {
      const flowSteps = nodes
        .filter(n => n.id !== 'start')
        .map(n => ({
          dayOffset: Number(n.data.dayOffset) || 0,
          channel: n.data.channel,
          messageTemplate: n.data.messageTemplate || '',
          templateId: n.data.templateId || null
        }))
        .sort((a, b) => a.dayOffset - b.dayOffset);

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'launch',
          name: campaignName,
          startDate: campaignStartDate,
          plansFilter: campaignPlansFilter,
          selectedPlans: campaignSelectedPlans,
          statusFilter: campaignStatusFilter,
          expiryDays: campaignStatusFilter === 'expired' ? Number(campaignExpiryDays) : undefined,
          userIds: campaignAgentIds,
          limitPerDay: campaignLimitEnabled && campaignLimitPerDay ? Number(campaignLimitPerDay) : null,
          smtpConfigId: campaignSmtpConfigId || null,
          excludeNurturing,
          pipelineId: campaignPipelineId || null,
          onWinJourneyId: campaignOnWinJourneyId || null,
          onLoseJourneyId: campaignOnLoseJourneyId || null,
          flowSteps,
          flowGraph: JSON.stringify({ nodes, edges })
        })
      });

      if (res.ok) {
        setCampaignName('');
        setCampaignSmtpConfigId('');
        setCampaignPlansFilter('all');
        setCampaignSelectedPlans([]);
        setCampaignStatusFilter('active');
        setCampaignExpiryDays('30');
        setCampaignStartDate(() => {
          const d = new Date();
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        });
        setCampaignAgentIds([]);
        setCampaignLimitPerDay('');
        setCampaignLimitEnabled(false);
        setCampaignOnWinJourneyId('');
        setCampaignOnLoseJourneyId('');
        setCampaignPipelineId('');
        setExcludeNurturing(true);
        setNodes([]);
        setEdges([]);
        setSelectedNodeId(null);
        setWizardStep(1);
        setShowCampaignModal(false);
        fetchCampaigns();
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Failed to launch campaign:', err);
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

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha? Os leads vinculados que NÃO foram atendidos sumirão do Kanban, e os já atendidos serão mantidos no CRM sem o vínculo com a campanha.')) {
      return;
    }

    try {
      const res = await fetch(`/api/campaigns?campaignId=${campaignId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedKpiCampaignId === campaignId) {
          setSelectedKpiCampaignId('');
        }
        fetchCampaigns();
        fetchLeads();
      } else {
        const errorData = await res.json();
        alert(`Erro ao excluir campanha: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Failed to delete campaign:', err);
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

  const renderAtendimento = () => {
    const filteredLeads = leads;

    return (
      <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header principal do Atendimento */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Central de Atendimento
              </h2>
              <p className="label-sm" style={{ marginTop: 2 }}>Gerencie leads, atenda alertas, reverta cancelados e controle as suas oportunidades em uma única fila.</p>
            </div>

            {/* Seletor "Ver como" */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-raised)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, paddingLeft: 8, color: 'var(--text-secondary)' }}>Ver como:</span>
              <button
                type="button"
                onClick={() => setAtendimentoViewMode('kanban')}
                style={{
                  padding: '6px 12px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: atendimentoViewMode === 'kanban' ? 'var(--accent)' : 'transparent',
                  color: atendimentoViewMode === 'kanban' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                📋 Kanban
              </button>
              <button
                type="button"
                onClick={() => setAtendimentoViewMode('list')}
                style={{
                  padding: '6px 12px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: atendimentoViewMode === 'list' ? 'var(--accent)' : 'transparent',
                  color: atendimentoViewMode === 'list' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                📄 Lista
              </button>
            </div>
          </div>

          {/* Filas de Atendimento (Row 2) */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
            <button
              type="button"
              onClick={() => setAtendimentoFila('campanhas')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: atendimentoFila === 'campanhas' ? 'var(--accent-glow)' : 'var(--surface)',
                borderColor: atendimentoFila === 'campanhas' ? 'var(--accent)' : 'var(--border)',
                color: atendimentoFila === 'campanhas' ? 'var(--accent)' : 'var(--text-secondary)'
              }}
            >
              🎯 Campanhas
              {filaCounts.campanhas > 0 && (
                <span className="badge" style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>
                  {filaCounts.campanhas}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setAtendimentoFila('alerts')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: atendimentoFila === 'alerts' ? 'var(--accent-glow)' : 'var(--surface)',
                borderColor: atendimentoFila === 'alerts' ? 'var(--accent)' : 'var(--border)',
                color: atendimentoFila === 'alerts' ? 'var(--accent)' : 'var(--text-secondary)'
              }}
            >
              🔔 Alertas / Tarefas
              {filaCounts.alerts > 0 && (
                <span className="badge" style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>
                  {filaCounts.alerts}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setAtendimentoFila('cancelados')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: atendimentoFila === 'cancelados' ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface)',
                borderColor: atendimentoFila === 'cancelados' ? '#EF4444' : 'var(--border)',
                color: atendimentoFila === 'cancelados' ? '#EF4444' : 'var(--text-secondary)'
              }}
            >
              🚫 Cancelados
              {filaCounts.cancelados > 0 && (
                <span className="badge" style={{ background: '#EF4444', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>
                  {filaCounts.cancelados}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setAtendimentoFila('expirar')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: atendimentoFila === 'expirar' ? 'rgba(245, 158, 11, 0.1)' : 'var(--surface)',
                borderColor: atendimentoFila === 'expirar' ? '#F59E0B' : 'var(--border)',
                color: atendimentoFila === 'expirar' ? '#F59E0B' : 'var(--text-secondary)'
              }}
            >
              ⏳ A Expirar
              {filaCounts.expirar > 0 && (
                <span className="badge" style={{ background: '#F59E0B', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>
                  {filaCounts.expirar}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setAtendimentoFila('abandonados')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: atendimentoFila === 'abandonados' ? 'rgba(6, 182, 212, 0.1)' : 'var(--surface)',
                borderColor: atendimentoFila === 'abandonados' ? 'var(--cyan)' : 'var(--border)',
                color: atendimentoFila === 'abandonados' ? 'var(--cyan)' : 'var(--text-secondary)'
              }}
            >
              🛒 Abandonados (Fila Geral)
              {filaCounts.abandonados > 0 && (
                <span className="badge" style={{ background: 'var(--cyan)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>
                  {filaCounts.abandonados}
                </span>
              )}
            </button>
          </div>

          {/* Controles de Filtro e Busca Unificados */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12, padding: 16, background: 'var(--surface-raised)', borderRadius: 12, border: '1px solid var(--border)'
          }}>
            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>🔍 Buscar Nome/Email/Telefone:</label>
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
                style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}
              >
                <option value="all">Todos os Planos</option>
                <option value="none">Cadastro Grátis (Sem Plano)</option>
                {users?.usersByPlan?.map((p: any) => (
                  <option key={p.planId} value={p.planId}>{p.planTitle}</option>
                ))}
              </select>
            </div>

            {isAdmin && (
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Responsável:</label>
                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}
                >
                  <option value="all">Todos os Colaboradores</option>
                  <option value="unassigned">Não Atribuídos</option>
                  {teamList.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {atendimentoFila === 'campanhas' && (
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>🎯 Campanha Comercial:</label>
                <select 
                  value={filterCampaignId} 
                  onChange={(e) => setFilterCampaignId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}
                >
                  <option value="all">Todas as Campanhas</option>
                  {campaignsData.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Competência:</label>
              <MonthSelector currentMonth={filterMonth} allowAll={true} />
            </div>
          </div>
        </div>

        {/* Abas de Funis (Pipelines) - Apenas se no Kanban */}
        {atendimentoViewMode === 'kanban' && (
          <div style={{ display: 'flex', gap: 8, background: 'var(--surface-raised)', padding: 6, borderRadius: 10, width: 'fit-content', border: '1px solid var(--border)' }}>
            {pipelines.map((pipeline) => (
              <button
                key={pipeline.id}
                onClick={() => setActivePipelineId(pipeline.id)}
                style={{
                  padding: '6px 16px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: activePipelineId === pipeline.id ? 'var(--accent)' : 'transparent',
                  color: activePipelineId === pipeline.id ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                ⚡ Funil: {pipeline.name}
              </button>
            ))}
          </div>
        )}

        {/* Renderização conforme View Mode */}
        {loadingLeads ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 20 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton" style={{ height: 50, width: '100%' }}></div>
            ))}
          </div>
        ) : atendimentoViewMode === 'kanban' ? (
          /* ==================== RENDERING KANBAN ==================== */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, overflowX: 'auto', minHeight: '60vh' }}>
            {(() => {
              const currentPipeline = pipelines.find(p => p.id === activePipelineId) || pipelines[0];
              const stages = currentPipeline ? currentPipeline.stages : [
                { key: 'novo_cadastro', label: 'Novo Cadastro' },
                { key: 'contato_inicial', label: 'Contato Inicial' },
                { key: 'negociacao', label: 'Em Negociação' },
                { key: 'convertido', label: 'Convertido / Ganho' },
                { key: 'perdido', label: 'Perdido / Descarte' }
              ];
              const STAGE_LABELS: Record<string, string> = {};
              stages?.forEach((s: any) => {
                STAGE_LABELS[s.key] = s.label;
              });

              return (stages as any[]).map((stage: any) => {
                const stageKey = stage.key;
                const stageLeads = filteredLeads.filter((l) => l.stage === stageKey);

                return (
                  <div 
                    key={stageKey}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, stageKey)}
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: 14, minWidth: 220, display: 'flex', flexDirection: 'column'
                    }}
                  >
                    {/* Column Header */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid ' + STAGE_COLORS[stageKey]
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: STAGE_COLORS[stageKey] }}></span>
                        {STAGE_LABELS[stageKey]}
                      </span>
                      <span className="badge badge-neu" style={{ fontSize: 11 }}>{stageLeads.length}</span>
                    </div>

                    {/* Cards Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto', maxHeight: '75vh' }}>
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
                            onDragStart={(e) => handleDragStart(e, lead.id, lead.journeyId)}
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
                              {lead.isBookPurchase && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899', border: '1px solid rgba(236, 72, 153, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                  📖 [Livro]
                                </span>
                              )}
                              {lead.subscriptionStatus === 'ativo' && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                  🟢 Ativo
                                </span>
                              )}
                              {lead.subscriptionStatus === 'cancelado' && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                  🔴 Cancelado
                                </span>
                              )}
                              {lead.subscriptionStatus === 'expirado' && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                  🟡 Expirado
                                </span>
                              )}
                              {lead.campaign && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--cyan)', border: '1px solid var(--cyan)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                  🎯 {lead.campaign.name}
                                </span>
                              )}
                              {lead.isInNurturing && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(124, 58, 237, 0.15)', color: '#7C3AED', border: '1px solid rgba(124, 58, 237, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                  🔄 Nutrição
                                </span>
                              )}
                              {lead.leadScore > 0 && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(234, 179, 8, 0.15)', color: '#CA8A04', border: '1px solid rgba(234, 179, 8, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                  🔥 Score: {lead.leadScore}
                                </span>
                              )}
                              {lead.hasPendingAlert && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--red)', border: '1px solid var(--red)', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                  ⚠️ Alerta!
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                              <strong>Plano:</strong> {lead.plan ? lead.plan.title : 'Sem Plano / Grátis'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', wordBreak: 'break-all', marginBottom: 4 }}>
                              📧 {lead.email || 'Sem e-mail'}
                            </div>
                            {lead.phoneNumber ? (
                              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                                📞 {lead.phoneNumber}
                              </div>
                            ) : (
                              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 8 }}>
                                📞 Sem telefone
                              </div>
                            )}
                            
                            {/* Botão de claim se for abandonado/sem responsável */}
                            {!lead.assignee && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const res = await fetch('/api/alerts', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        action: 'claim',
                                        personId: lead.id
                                      })
                                    });
                                    if (res.ok) {
                                      fetchLeads();
                                    }
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                className="btn-action btn-action-purple"
                                style={{ width: '100%', fontSize: 11, padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                              >
                                📥 Assumir Atendimento
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          /* ==================== RENDERING LIST ==================== */
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Filas / Badges</th>
                    <th>E-mail</th>
                    <th>Telefone</th>
                    <th>Plano Ativo</th>
                    <th>Estágio Funil</th>
                    <th>Responsável</th>
                    <th style={{ textAlign: 'center' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
                        Nenhum lead correspondente à fila foi encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      return (
                        <tr key={lead.id} onClick={() => openTimeline(lead)} style={{ cursor: 'pointer' }}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.fullName}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {lead.tag === 'CANCELED_CLIENT' && (
                                <span className="badge badge-down" style={{ fontSize: 9, padding: '2px 6px' }}>
                                  🚫 Cancelado
                                </span>
                              )}
                              {lead.isBookPurchase && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                                  📖 [Livro]
                                </span>
                              )}
                              {lead.subscriptionStatus === 'ativo' && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                  Ativo
                                </span>
                              )}
                              {lead.subscriptionStatus === 'cancelado' && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                  Cancelado
                                </span>
                              )}
                              {lead.subscriptionStatus === 'expirado' && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                  Expirado
                                </span>
                              )}
                              {lead.campaign && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--cyan)', border: '1px solid var(--cyan)' }}>
                                  🎯 {lead.campaign.name}
                                </span>
                              )}
                              {lead.isInNurturing && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(124, 58, 237, 0.15)', color: '#7C3AED', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
                                  🔄 Nutrição
                                </span>
                              )}
                              {lead.leadScore > 0 && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(234, 179, 8, 0.15)', color: '#CA8A04', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                                  🔥 Score: {lead.leadScore}
                                </span>
                              )}
                              {lead.hasPendingAlert && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--red)', border: '1px solid var(--red)', fontWeight: 'bold' }}>
                                  ⚠️ Alerta
                                </span>
                              )}
                            </div>
                          </td>
                          <td><span className="stat-mono" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{lead.email}</span></td>
                          <td><span className="stat-mono" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{lead.phoneNumber || 'Sem fone'}</span></td>
                          <td>{lead.plan ? lead.plan.title : 'Sem Plano / Grátis'}</td>
                          <td>
                            <span 
                              className="badge" 
                              style={{ 
                                background: `${STAGE_COLORS[lead.stage]}1A`, 
                                color: STAGE_COLORS[lead.stage],
                                border: `1px solid ${STAGE_COLORS[lead.stage]}33`,
                                fontSize: 11
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
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => openTimeline(lead)}
                                className="btn-action btn-action-outline"
                                style={{ fontSize: 11, padding: '4px 10px' }}
                              >
                                ⚡ Atender
                              </button>
                              {!lead.assignee && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch('/api/alerts', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          action: 'claim',
                                          personId: lead.id
                                        })
                                      });
                                      if (res.ok) {
                                        fetchLeads();
                                      }
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="btn-action btn-action-purple"
                                  style={{ fontSize: 11, padding: '4px 10px' }}
                                >
                                  📥 Assumir
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Exibir:</span>
                <select
                  value={leadsLimit}
                  onChange={(e) => {
                    setLeadsLimit(Number(e.target.value));
                    setLeadsPage(1);
                  }}
                  style={{
                    background: 'var(--surface-raised)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', borderRadius: 6, padding: '4px 8px', fontSize: 12, outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                </select>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
                  Mostrando {filteredLeads.length} de {leadsTotal} contatos
                </span>
              </div>

              {leadsTotalPages > 1 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    disabled={leadsPage === 1}
                    onClick={() => setLeadsPage(prev => Math.max(1, prev - 1))}
                    className="btn-action btn-action-outline"
                    style={{ padding: '6px 12px', fontSize: 12, opacity: leadsPage === 1 ? 0.5 : 1, cursor: leadsPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    ◀️ Anterior
                  </button>

                  {Array.from({ length: leadsTotalPages }, (_, idx) => idx + 1).map(p => {
                    if (leadsTotalPages > 5 && Math.abs(p - leadsPage) > 2 && p !== 1 && p !== leadsTotalPages) {
                      if (p === 2 || p === leadsTotalPages - 1) {
                        return <span key={p} style={{ alignSelf: 'center', color: 'var(--text-faint)', padding: '0 4px' }}>...</span>;
                      }
                      return null;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setLeadsPage(p)}
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          background: leadsPage === p ? 'var(--accent)' : 'transparent',
                          color: leadsPage === p ? '#fff' : 'var(--text-primary)'
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    disabled={leadsPage === leadsTotalPages}
                    onClick={() => setLeadsPage(prev => Math.min(leadsTotalPages, prev + 1))}
                    className="btn-action btn-action-outline"
                    style={{ padding: '6px 12px', fontSize: 12, opacity: leadsPage === leadsTotalPages ? 0.5 : 1, cursor: leadsPage === leadsTotalPages ? 'not-allowed' : 'pointer' }}
                  >
                    Próxima ▶️
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
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
            onClick={() => setActiveTab('atendimento')}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: activeTab === 'atendimento' ? 'var(--accent-glow)' : 'transparent',
              color: activeTab === 'atendimento' ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            🎧 Atendimento
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
              ⚙️ Administração
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
              <MonthSelector currentMonth={filterMonth} allowAll={false} />
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

      {/* 2. Atendimento Hub (ADMIN & AGENT) */}
      {activeTab === 'atendimento' && renderAtendimento()}





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
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginRight: 12 }}>{campaign.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="badge badge-cyan" style={{ fontSize: 9 }}>{campaign.status}</span>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          style={{
                            background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer',
                            fontSize: 12, padding: '2px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Excluir Campanha"
                        >
                          🗑️
                        </button>
                      </div>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                  <div className="stat-card" style={{ padding: 16, background: 'var(--surface-raised)' }}>
                    <div className="label-sm">Total de Leads</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0' }}>{kpiData.summary.totalLeads}</div>
                    <div className="label-sm" style={{ color: 'var(--text-faint)' }}>Vinculados à campanha</div>
                  </div>
                  <div className="stat-card" style={{ padding: 16, background: 'var(--surface-raised)' }}>
                    <div className="label-sm">Atendidos (Resposta)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', margin: '6px 0' }}>{kpiData.summary.attendedLeads}</div>
                    <div className="label-sm" style={{ color: 'var(--text-faint)' }}>Taxa: {kpiData.summary.responseRate?.toFixed(1) || '0.0'}%</div>
                  </div>
                  <div className="stat-card" style={{ padding: 16, background: 'var(--surface-raised)' }}>
                    <div className="label-sm">Convertidos (Ganhos)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green)', margin: '6px 0' }}>{kpiData.summary.convertedLeads}</div>
                    <div className="label-sm" style={{ color: 'var(--text-faint)' }}>Win Rate: {kpiData.summary.winRate.toFixed(1)}%</div>
                  </div>
                  <div className="stat-card" style={{ padding: 16, background: 'var(--surface-raised)' }}>
                    <div className="label-sm">Receita Recuperada</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', margin: '6px 0' }}>R$ {kpiData.summary.recoveredRevenue?.toLocaleString('pt-BR') || '0'}</div>
                    <div className="label-sm" style={{ color: 'var(--text-faint)' }}>MRR reativado</div>
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

              {/* Visual conversion funnel and progress bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 8 }}>
                  {/* Styled visual horizontal funnel */}
                  <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: 20, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>🎯 Funil Comercial da Campanha</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Step 1: Total Leads */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: 100, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Adicionados:</div>
                        <div style={{ flex: 1, background: 'var(--border)', height: 24, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                          <div style={{ background: 'var(--accent)', height: '100%', width: '100%', opacity: 0.3 }}></div>
                          <div style={{ position: 'absolute', top: 0, left: 12, height: '100%', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {kpiData.summary.totalLeads} leads (100%)
                          </div>
                        </div>
                      </div>

                      {/* Step 2: Attended */}
                      {(() => {
                        const attendedPct = kpiData.summary.totalLeads > 0 ? (kpiData.summary.attendedLeads / kpiData.summary.totalLeads) * 100 : 0;
                        return (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: 100, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Contatados:</div>
                            <div style={{ flex: 1, background: 'var(--border)', height: 24, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                              <div style={{ background: 'var(--accent)', height: '100%', width: `${attendedPct}%` }}></div>
                              <div style={{ position: 'absolute', top: 0, left: 12, height: '100%', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                                {kpiData.summary.attendedLeads} leads ({attendedPct.toFixed(0)}%)
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Step 3: Converted */}
                      {(() => {
                        const convertedPct = kpiData.summary.totalLeads > 0 ? (kpiData.summary.convertedLeads / kpiData.summary.totalLeads) * 100 : 0;
                        return (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: 100, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Convertidos:</div>
                            <div style={{ flex: 1, background: 'var(--border)', height: 24, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                              <div style={{ background: 'var(--green)', height: '100%', width: `${convertedPct}%` }}></div>
                              <div style={{ position: 'absolute', top: 0, left: 12, height: '100%', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                                {kpiData.summary.convertedLeads} leads ({convertedPct.toFixed(0)}%)
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Win Rate Progress circle or bar */}
                  <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: 20, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>📈 Taxa de Conversão (Win Rate)</div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Porcentagem de leads convertidos na campanha</p>
                    </div>

                    <div style={{ margin: '16px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                        <span>Conversão</span>
                        <span style={{ color: 'var(--green)' }}>{kpiData.summary.winRate.toFixed(1)}%</span>
                      </div>
                      <div style={{ width: '100%', height: 12, background: 'var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ background: 'var(--green)', height: '100%', width: `${Math.min(100, kpiData.summary.winRate)}%`, borderRadius: 6 }}></div>
                      </div>
                    </div>

                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Média ideal de CS/Vendas Odonto: ~12% a 18%
                    </div>
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
                  <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: 16, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>🚨 Motivos de Perda (Objeções)</div>
                    {kpiData.lostReasonsDistribution.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-faint)', padding: 10, textAlign: 'center' }}>Sem descartes na campanha selecionada.</div>
                    ) : (
                      <>
                        {/* Recharts Pie Chart */}
                        <div style={{ width: '100%', height: 160 }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={kpiData.lostReasonsDistribution.map((lrd: any) => {
                                  const labelMap: Record<string, string> = {
                                    PRICE_TOO_HIGH: 'Preço Elevado',
                                    GHOSTING: 'Sem contato',
                                    MISSING_CONTENT: 'Conteúdo',
                                    UNQUALIFIED: 'Sem perfil'
                                  };
                                  return {
                                    name: labelMap[lrd.reason] || lrd.reason,
                                    value: lrd.count
                                  };
                                })}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={55}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                              >
                                {kpiData.lostReasonsDistribution.map((_: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={['#F87171', '#FB923C', '#FBBF24', '#60A5FA', '#A78BFA', '#34D399'][index % 6]} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8 }}
                                itemStyle={{ color: 'var(--text-primary)', fontSize: 11 }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Detailed count list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                          {kpiData.lostReasonsDistribution.map((lrd: any, index: number) => {
                            const labelMap: Record<string, string> = {
                              PRICE_TOO_HIGH: 'Preço Elevado',
                              GHOSTING: 'Não respondeu / Sem contato',
                              MISSING_CONTENT: 'Falta de conteúdo relevante',
                              UNQUALIFIED: 'Não qualificado / Sem perfil'
                            };
                            const dotColor = ['#F87171', '#FB923C', '#FBBF24', '#60A5FA', '#A78BFA', '#34D399'][index % 6];
                            return (
                              <div key={lrd.reason} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: dotColor }}></span>
                                  {labelMap[lrd.reason] || lrd.reason}
                                </span>
                                <span style={{ fontWeight: 'bold', color: 'var(--red)' }}>{lrd.count} descartes</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Gerenciar Equipe (ADMIN Only) */}
      {/* 4. Administração (ADMIN Only) */}
      {activeTab === 'team' && isAdmin && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="animate-fadeUp">
          {/* Coluna 1: Configuração de Serviços */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>⚙️ Configurações do Sistema</div>
              <div className="label-sm">Configure as conexões externas de SMTP, VoIP e WhatsApp.</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: '70vh', paddingRight: 8 }}>
              {/* Seção SMTP */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>📧 Servidor SMTP (E-mail RapidFire)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>SMTP Host:</label>
                    <input
                      type="text"
                      value={settingsForm.smtpHost}
                      onChange={(e) => setSettingsForm({ ...settingsForm, smtpHost: e.target.value })}
                      placeholder="smtp.mailtrap.io"
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                    <div>
                      <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Porta:</label>
                      <input
                        type="text"
                        value={settingsForm.smtpPort}
                        onChange={(e) => setSettingsForm({ ...settingsForm, smtpPort: e.target.value })}
                        placeholder="587"
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>E-mail Remetente (From):</label>
                      <input
                        type="text"
                        value={settingsForm.smtpFrom}
                        onChange={(e) => setSettingsForm({ ...settingsForm, smtpFrom: e.target.value })}
                        placeholder="crm@dentalgo.com"
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>SMTP Usuário:</label>
                      <input
                        type="text"
                        value={settingsForm.smtpUser}
                        onChange={(e) => setSettingsForm({ ...settingsForm, smtpUser: e.target.value })}
                        placeholder="user123"
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>SMTP Senha:</label>
                      <input
                        type="password"
                        value={settingsForm.smtpPassword}
                        onChange={(e) => setSettingsForm({ ...settingsForm, smtpPassword: e.target.value })}
                        placeholder="••••••••"
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção VoIP */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>📞 Provedor VoIP (Telefone RapidFire)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Serviço VoIP Externo:</label>
                    <select
                      value={settingsForm.voipProvider}
                      onChange={(e) => setSettingsForm({ ...settingsForm, voipProvider: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                    >
                      <option value="twilio">Twilio VoIP Link</option>
                      <option value="zenvia">Zenvia Voz</option>
                      <option value="vonage">Vonage Voice API</option>
                      <option value="custom">Outro (Integração Direta)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Token/API Key:</label>
                    <input
                      type="password"
                      value={settingsForm.voipApiKey}
                      onChange={(e) => setSettingsForm({ ...settingsForm, voipApiKey: e.target.value })}
                      placeholder="sk_live_..."
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Account SID / ID:</label>
                      <input
                        type="text"
                        value={settingsForm.voipAccountSid}
                        onChange={(e) => setSettingsForm({ ...settingsForm, voipAccountSid: e.target.value })}
                        placeholder="AC..."
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Linha VoIP / Ramal:</label>
                      <input
                        type="text"
                        value={settingsForm.voipLineNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, voipLineNumber: e.target.value })}
                        placeholder="+55119999999"
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção WhatsApp Evolution */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>💬 WhatsApp Evolution API (Alert Center)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>URL da API:</label>
                    <input
                      type="text"
                      value={settingsForm.whatsappUrl}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsappUrl: e.target.value })}
                      placeholder="https://api.evolution.dentalgo.com"
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
                    <div>
                      <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>API Key (Token):</label>
                      <input
                        type="password"
                        value={settingsForm.whatsappApiKey}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappApiKey: e.target.value })}
                        placeholder="Bearer token..."
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Instância:</label>
                      <input
                        type="text"
                        value={settingsForm.whatsappInstance}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappInstance: e.target.value })}
                        placeholder="DentalGO_CRM"
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleSyncCRM}
                  disabled={isSyncingCRM}
                  className="btn-action btn-action-outline"
                  style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, borderColor: 'var(--accent)', color: 'var(--accent)' }}
                >
                  {isSyncingCRM ? 'Sincronizando...' : '🔄 Sincronizar CRM'}
                </button>
                {syncFeedback && <span style={{ color: syncFeedback.startsWith('❌') ? '#F87171' : '#4ADE80', fontSize: 11, fontWeight: 600 }}>{syncFeedback}</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {settingsSavedFeedback && <span style={{ color: '#4ADE80', fontSize: 13, fontWeight: 600 }}>✓ Configurações Salvas!</span>}
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="btn-action btn-action-purple"
                  style={{ padding: '8px 24px', fontSize: 13, borderRadius: 8 }}
                >
                  {savingSettings ? 'Salvando...' : '💾 Salvar Configurações'}
                </button>
              </div>
            </div>
          </div>

          {/* Coluna 2: Gerenciar Equipe */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>👥 Gerenciar Equipe</div>
                <div className="label-sm">Cadastre e gerencie acessos de colaboradores.</div>
              </div>
              <button onClick={openAddAgent} className="btn-action btn-action-purple" style={{ padding: '6px 12px', fontSize: 12 }}>
                ➕ Novo Colaborador
              </button>
            </div>

            <div className="table-container" style={{ overflowY: 'auto', maxHeight: '70vh' }}>
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cargo / Role</th>
                    <th style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {teamList.map((agent) => (
                    <tr key={agent.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div>{agent.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 'normal' }}>{agent.email}</div>
                      </td>
                      <td>
                        <span className={`badge ${agent.role === 'ADMIN' ? 'badge-cyan' : 'badge-neu'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                          {agent.role === 'ADMIN' ? 'Administrador' : 'Agente'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button 
                            onClick={() => openEditAgent(agent)}
                            style={{
                              padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6,
                              background: 'var(--surface-raised)', color: 'var(--text-secondary)', fontSize: 11,
                              cursor: 'pointer'
                            }}
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleToggleAgentStatus(agent)}
                            style={{
                              padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6,
                              background: 'transparent', color: agent.isActive ? 'var(--red)' : 'var(--green)', fontSize: 11,
                              cursor: 'pointer'
                            }}
                          >
                            {agent.isActive ? 'Bloquear' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Gerenciamento de Servidores SMTP e Biblioteca de Templates (DentalGO CRM 360) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }} className="animate-fadeUp">
          {/* Card SMTP */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>📧 Servidores SMTP do Sistema</div>
              <div className="label-sm">Cadastre múltiplos servidores SMTP de disparo para as campanhas.</div>
            </div>

            <form onSubmit={handleSaveSmtp} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface-raised)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                {smtpId ? '✏️ Editar SMTP' : '➕ Novo SMTP'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Nome do Servidor:</label>
                  <input
                    type="text"
                    required
                    value={smtpName}
                    onChange={(e) => setSmtpName(e.target.value)}
                    placeholder="Ex: Disparo Mailtrap ou SMTP Locaweb"
                    style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Secure (SSL/TLS):</label>
                  <select
                    value={smtpSecure ? 'true' : 'false'}
                    onChange={(e) => setSmtpSecure(e.target.value === 'true')}
                    style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                  >
                    <option value="false">Não</option>
                    <option value="true">Sim</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 10 }}>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Host SMTP:</label>
                  <input
                    type="text"
                    required
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.mailtrap.io"
                    style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Porta:</label>
                  <input
                    type="text"
                    required
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587"
                    style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Usuário SMTP:</label>
                  <input
                    type="text"
                    required
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="remetente@dominio.com"
                    style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Senha SMTP:</label>
                  <input
                    type="password"
                    required={!smtpId}
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder={smtpId ? '••••••••' : 'Sua senha'}
                    style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                  />
                </div>
              </div>

              {smtpTestResult && (
                <div style={{ fontSize: 11, fontWeight: 600, color: smtpTestResult.startsWith('🟢') ? 'var(--green)' : 'var(--red)', marginTop: 4 }}>
                  {smtpTestResult}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                {smtpId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSmtpId('');
                      setSmtpName('');
                      setSmtpHost('');
                      setSmtpPort('587');
                      setSmtpUser('');
                      setSmtpPass('');
                      setSmtpSecure(false);
                      setSmtpTestResult(null);
                    }}
                    className="btn-action btn-action-outline"
                    style={{ fontSize: 11, padding: '6px 12px' }}
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  disabled={smtpTesting}
                  onClick={handleTestSmtp}
                  className="btn-action btn-action-outline"
                  style={{ fontSize: 11, padding: '6px 12px' }}
                >
                  {smtpTesting ? 'Testando...' : '🔌 Testar Conexão'}
                </button>
                <button
                  type="submit"
                  className="btn-action btn-action-purple"
                  style={{ fontSize: 11, padding: '6px 16px' }}
                >
                  💾 {smtpId ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>

            <div className="table-container" style={{ overflowY: 'auto', maxHeight: '35vh', marginTop: 10 }}>
              {loadingSmtps ? (
                <div className="skeleton" style={{ height: 60, width: '100%' }}></div>
              ) : smtpConfigs.length === 0 ? (
                <div className="label-sm" style={{ padding: 20, textAlign: 'center' }}>Nenhum SMTP cadastrado.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Nome / Host</th>
                      <th>Usuário</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {smtpConfigs.map((config) => (
                      <tr key={config.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div>{config.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{config.host}:{config.port}</div>
                        </td>
                        <td style={{ fontSize: 11 }}>{config.user}</td>
                        <td>
                          {config.active ? (
                            <span className="badge badge-cyan" style={{ fontSize: 9 }}>Ativo</span>
                          ) : (
                            <button
                              onClick={() => handleActivateSmtp(config.id)}
                              className="btn-action btn-action-outline"
                              style={{ fontSize: 9, padding: '2px 6px' }}
                            >
                              Ativar
                            </button>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              onClick={() => {
                                setSmtpId(config.id);
                                setSmtpName(config.name);
                                setSmtpHost(config.host);
                                setSmtpPort(String(config.port));
                                setSmtpUser(config.user);
                                setSmtpPass('••••••••');
                                setSmtpSecure(config.secure);
                                setSmtpTestResult(null);
                              }}
                              style={{ padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface-raised)', color: 'var(--text-secondary)', fontSize: 10, cursor: 'pointer' }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteSmtp(config.id)}
                              style={{ padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--red)', fontSize: 10, cursor: 'pointer' }}
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Card Templates */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>📝 Biblioteca de Templates de Mensagens</div>
              <div className="label-sm">Gerencie os modelos de mensagens usados pelas automações (Email e WhatsApp).</div>
            </div>

            <form onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface-raised)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                {tplId ? '✏️ Editar Template' : '➕ Novo Template'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Nome do Template:</label>
                  <input
                    type="text"
                    required
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                    placeholder="Ex: Boas-vindas Premium"
                    style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Tipo:</label>
                  <select
                    value={tplType}
                    onChange={(e) => setTplType(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                  >
                    <option value="EMAIL">📧 E-mail</option>
                    <option value="WHATSAPP">💬 WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Idioma:</label>
                  <select
                    value={tplLang}
                    onChange={(e) => setTplLang(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                  >
                    <option value="PT">PT</option>
                    <option value="EN">EN</option>
                    <option value="ES">ES</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Descrição (Opcional):</label>
                <input
                  type="text"
                  value={tplDesc}
                  onChange={(e) => setTplDesc(e.target.value)}
                  placeholder="Ex: Enviado após assinar o plano premium."
                  style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                />
              </div>

              {tplType === 'EMAIL' && (
                <div className="animate-fadeUp">
                  <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Assunto do E-mail:</label>
                  <input
                    type="text"
                    required={tplType === 'EMAIL'}
                    value={tplSubject}
                    onChange={(e) => setTplSubject(e.target.value)}
                    placeholder="Ex: Seja muito bem-vindo ao DentalGO!"
                    style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                  />
                </div>
              )}

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 2 }}>Conteúdo (Corpo da Mensagem):</label>
                <textarea
                  required
                  value={tplContent}
                  onChange={(e) => setTplContent(e.target.value)}
                  placeholder={tplType === 'EMAIL' ? "Olá {{customer.fullName}},\n\nSeja bem-vindo!" : "Olá {{customer.fullName}}, vimos que..."}
                  style={{ width: '100%', height: 70, padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, resize: 'none', outline: 'none' }}
                />
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Variáveis suportadas: {"{{customer.fullName}}"}, {"{{customer.city}}"}, {"{{customer.plan}}"}</span>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                {tplId && (
                  <button
                    type="button"
                    onClick={() => {
                      setTplId('');
                      setTplName('');
                      setTplDesc('');
                      setTplType('EMAIL');
                      setTplLang('PT');
                      setTplSubject('');
                      setTplContent('');
                    }}
                    className="btn-action btn-action-outline"
                    style={{ fontSize: 11, padding: '6px 12px' }}
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-action btn-action-purple"
                  style={{ fontSize: 11, padding: '6px 16px' }}
                >
                  💾 {tplId ? 'Atualizar' : 'Salvar Template'}
                </button>
              </div>
            </form>

            <div className="table-container" style={{ overflowY: 'auto', maxHeight: '35vh', marginTop: 10 }}>
              {loadingTemplates ? (
                <div className="skeleton" style={{ height: 60, width: '100%' }}></div>
              ) : templatesList.length === 0 ? (
                <div className="label-sm" style={{ padding: 20, textAlign: 'center' }}>Nenhum template cadastrado.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Tipo / Idioma</th>
                      <th style={{ textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templatesList.map((tpl) => (
                      <tr key={tpl.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div>{tpl.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{tpl.description || 'Sem descrição.'}</div>
                        </td>
                        <td style={{ fontSize: 11 }}>
                          <span className={`badge ${tpl.type === 'EMAIL' ? 'badge-cyan' : 'badge-purple'}`} style={{ fontSize: 9, marginRight: 6 }}>
                            {tpl.type === 'EMAIL' ? '📧 Email' : '💬 WhatsApp'}
                          </span>
                          <span className="badge badge-neu" style={{ fontSize: 9 }}>{tpl.language}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              onClick={() => {
                                setTplId(tpl.id);
                                setTplName(tpl.name);
                                setTplDesc(tpl.description || '');
                                setTplType(tpl.type);
                                setTplLang(tpl.language);
                                setTplSubject(tpl.subject || '');
                                setTplContent(tpl.content);
                              }}
                              style={{ padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface-raised)', color: 'var(--text-secondary)', fontSize: 10, cursor: 'pointer' }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              style={{ padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--red)', fontSize: 10, cursor: 'pointer' }}
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </>
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
                <p className="label-sm" style={{ marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span>👤 {selectedLead.fullName}</span>
                  <span>&bull;</span>
                  <span>📧 {selectedLead.email || 'Sem e-mail'}</span>
                  <span>&bull;</span>
                  {selectedLead.phoneNumber ? (
                    <span>
                      📞{' '}
                      <a 
                        href={formatWhatsappLink(selectedLead.phoneNumber) || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
                      >
                        {selectedLead.phoneNumber} 🟢 (WhatsApp)
                      </a>
                    </span>
                  ) : (
                    <span>📞 Sem telefone</span>
                  )}
                </p>
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
            
            {/* Informações do Perfil (Metadata) */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24,
              padding: 16, background: 'var(--surface-raised)', borderRadius: 12, border: '1px solid var(--border)',
              position: 'relative'
            }}>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)' }}>Instagram:</label>
                {isEditingInst ? (
                  <input
                    type="text"
                    value={metaInstagram}
                    onChange={(e) => setMetaInstagram(e.target.value)}
                    onBlur={() => {
                      setIsEditingInst(false);
                      handleSaveMetadata(metaInstagram, metaSpecialty);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    autoFocus
                    placeholder="@usuario"
                    style={{
                      width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, outline: 'none'
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38 }}>
                    {metaInstagram ? (
                      <>
                        <a
                          href={`https://instagram.com/${metaInstagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            color: '#E1306C', fontWeight: 600, fontSize: 13, textDecoration: 'none'
                          }}
                        >
                          <svg style={{ width: 16, height: 16, fill: '#E1306C' }} viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </svg>
                          <span>{metaInstagram.startsWith('@') ? metaInstagram : `@${metaInstagram}`}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setIsEditingInst(true)}
                          style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            fontSize: 11, cursor: 'pointer', textDecoration: 'underline', padding: 0
                          }}
                        >
                          Editar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingInst(true)}
                        style={{
                          background: 'none', border: '1px dashed var(--border)', color: 'var(--text-muted)',
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <span>➕</span> <span>Adicionar Instagram</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)' }}>Especialidade / Atuação:</label>
                <select
                  value={metaSpecialty}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMetaSpecialty(val);
                    handleSaveMetadata(metaInstagram, val);
                  }}
                  style={{
                    width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value="">Selecione a especialidade...</option>
                  <option value="Ortodontia">Ortodontia</option>
                  <option value="Implantodontia">Implantodontia</option>
                  <option value="Odontopediatria">Odontopediatria</option>
                  <option value="Harmonização Orofacial (HOF)">Harmonização Orofacial (HOF)</option>
                  <option value="Endodontia">Endodontia</option>
                  <option value="Periodontia">Periodontia</option>
                  <option value="Clínico Geral">Clínico Geral</option>
                  <option value="Prótese Dentária">Prótese Dentária</option>
                  <option value="Outra">Outra</option>
                </select>
              </div>

              {/* Success Indicator inside card (autosave feedback) */}
              <div style={{ position: 'absolute', right: 12, top: 4 }}>
                {metaSaved && <span style={{ color: '#4ADE80', fontSize: 11, fontWeight: 600 }}>✓ Salvo!</span>}
                {isSavingMeta && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Salvando...</span>}
              </div>
            </div>

            {/* RapidFire Communications Hub */}
            <div style={{
              background: 'var(--surface-raised)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 16, marginBottom: 24
            }}>
              <div className="label-sm" style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                ⚡ RapidFire Hub (Canais de Alta Velocidade)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: activeRapidFireTab ? 16 : 0 }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRapidFireTab(activeRapidFireTab === 'whatsapp' ? null : 'whatsapp');
                    if (selectedLead.phoneNumber) {
                      window.open(formatWhatsappLink(selectedLead.phoneNumber) || '#', '_blank', 'width=1000,height=750,noopener,noreferrer');
                    }
                  }}
                  className={`btn-action ${activeRapidFireTab === 'whatsapp' ? 'btn-action-purple' : 'btn-action-outline'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, padding: '8px 12px' }}
                >
                  💬 WhatsApp Rapid
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRapidFireTab(activeRapidFireTab === 'email' ? null : 'email')}
                  className={`btn-action ${activeRapidFireTab === 'email' ? 'btn-action-purple' : 'btn-action-outline'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, padding: '8px 12px' }}
                >
                  📧 E-mail Rapid
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRapidFireTab(activeRapidFireTab === 'voip' ? null : 'voip')}
                  className={`btn-action ${activeRapidFireTab === 'voip' ? 'btn-action-purple' : 'btn-action-outline'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, padding: '8px 12px' }}
                >
                  📞 VoIP Telefone
                </button>
              </div>

              {/* Sub-panels for active tabs */}
              {activeRapidFireTab === 'whatsapp' && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p className="label-sm" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    O chat de WhatsApp foi aberto em uma janela popup. Copie as mensagens relevantes e cole abaixo para arquivar na timeline do cliente.
                  </p>
                  <textarea
                    id="wa-rapidfire-textarea"
                    value={waPasteText}
                    onChange={(e) => setWaPasteText(e.target.value)}
                    placeholder="Cole aqui o texto ou conversa do WhatsApp..."
                    style={{
                      width: '100%', height: 90, padding: '10px', background: 'var(--surface)',
                      border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
                      fontSize: 12, outline: 'none', resize: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    {waPasteText && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const textarea = document.getElementById('wa-rapidfire-textarea') as HTMLTextAreaElement;
                            if (textarea) {
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const selectedText = textarea.value.substring(start, end);
                              if (selectedText.trim()) {
                                setDetailNote(selectedText);
                                alert('Seleção copiada para o campo de Notas abaixo!');
                              } else {
                                alert('Por favor, selecione (grife) uma parte do texto com o mouse primeiro.');
                              }
                            }
                          }}
                          className="btn-action btn-action-outline"
                          style={{ fontSize: 11, padding: '6px 12px', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                        >
                          ✂️ Copiar Selecionado para Nova Nota
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(waPasteText);
                            alert('Texto copiado para a área de transferência!');
                          }}
                          className="btn-action btn-action-outline"
                          style={{ fontSize: 11, padding: '6px 12px' }}
                        >
                          📋 Copiar Todo o Conteúdo
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={!waPasteText || isSendingRapidFire}
                      onClick={async () => {
                        if (!waPasteText) return;
                        setIsSendingRapidFire(true);
                        try {
                          const res = await fetch('/api/crm', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              emailOrId: selectedLead.id,
                              note: `💬 [WhatsApp RapidFire]:\n"${waPasteText}"`,
                              stage: selectedLead.stage
                            })
                          });
                          if (res.ok) {
                            setWaPasteText('');
                            // Reload timeline
                            const leadsRes = await fetch(`/api/leads?leadId=${selectedLead.id}`);
                            if (leadsRes.ok) {
                              const json = await leadsRes.json();
                              if (json.data && json.data.length > 0) {
                                setSelectedLead(json.data[0]);
                              }
                            }
                            fetchLeads();
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsSendingRapidFire(false);
                        }
                      }}
                      className="btn-action btn-action-purple"
                      style={{ fontSize: 11, padding: '6px 12px' }}
                    >
                      {isSendingRapidFire ? 'Salvando...' : '📥 Registrar na Timeline'}
                    </button>
                  </div>
                </div>
              )}

              {activeRapidFireTab === 'email' && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p className="label-sm" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Dispare e-mails diretos integrados ao servidor SMTP de sua equipe.
                  </p>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Assunto do E-mail"
                    style={{
                      width: '100%', padding: '8px 12px', background: 'var(--surface)',
                      border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
                      fontSize: 12, outline: 'none'
                    }}
                  />
                  <textarea
                    value={emailBodyText}
                    onChange={(e) => setEmailBodyText(e.target.value)}
                    placeholder="Corpo da mensagem do e-mail..."
                    style={{
                      width: '100%', height: 90, padding: '10px', background: 'var(--surface)',
                      border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
                      fontSize: 12, outline: 'none', resize: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      disabled={!emailSubject || !emailBodyText || isSendingRapidFire}
                      onClick={async () => {
                        setIsSendingRapidFire(true);
                        try {
                          const res = await fetch('/api/leads/email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              leadId: selectedLead.id,
                              subject: emailSubject,
                              emailBody: emailBodyText
                            })
                          });
                          if (res.ok) {
                            setEmailBodyText('');
                            // Reload timeline
                            const leadsRes = await fetch(`/api/leads?leadId=${selectedLead.id}`);
                            if (leadsRes.ok) {
                              const json = await leadsRes.json();
                              if (json.data && json.data.length > 0) {
                                setSelectedLead(json.data[0]);
                              }
                            }
                            fetchLeads();
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsSendingRapidFire(false);
                        }
                      }}
                      className="btn-action btn-action-purple"
                      style={{ fontSize: 11, padding: '6px 12px' }}
                    >
                      {isSendingRapidFire ? 'Enviando...' : '📤 Disparar E-mail'}
                    </button>
                  </div>
                </div>
              )}

              {activeRapidFireTab === 'voip' && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p className="label-sm" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Iniciar chamada de áudio VoIP direta.
                  </p>
                  <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                      📞 {selectedLead.phoneNumber || 'Sem número cadastrado'}
                    </span>
                    <button
                      type="button"
                      disabled={!selectedLead.phoneNumber || isSendingRapidFire}
                      onClick={async () => {
                        setIsSendingRapidFire(true);
                        try {
                          const res = await fetch('/api/leads/call', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              leadId: selectedLead.id
                            })
                          });
                          if (res.ok) {
                            // Reload timeline
                            const leadsRes = await fetch(`/api/leads?leadId=${selectedLead.id}`);
                            if (leadsRes.ok) {
                              const json = await leadsRes.json();
                              if (json.data && json.data.length > 0) {
                                setSelectedLead(json.data[0]);
                              }
                            }
                            fetchLeads();
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsSendingRapidFire(false);
                        }
                      }}
                      className="btn-action btn-action-purple"
                      style={{ fontSize: 11, padding: '6px 12px' }}
                    >
                      {isSendingRapidFire ? 'Chamando...' : '📞 Discar VoIP'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Notes Area */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 24, paddingRight: 8 }}>
              <div className="label" style={{ marginBottom: 12 }}>Histórico de Interações (Timeline)</div>
              <Timeline events={selectedLead.notes || []} />
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
      {/* MODAL 4.5: Motivo da Perda (Saída do Funil) */}
      {/* ====================================================================== */}
      {showLossReasonSelection && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', background: 'var(--surface)', padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700 }}>
                🚨 Motivo do Descarte / Perda
              </h3>
              <button 
                onClick={() => {
                  setShowLossReasonSelection(false);
                  setLossTargetLeadId(null);
                  setLossTargetStage(null);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.4 }}>
              Para mover o cliente para <strong>Perdido</strong>, é obrigatório selecionar a justificativa abaixo. Isso alimentará as métricas do BI.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={() => handleConfirmLoss('PRICE_TOO_HIGH')}
                className="btn-action"
                style={{
                  padding: '12px', background: 'var(--surface-raised)', border: '1px solid #F87171',
                  borderRadius: 8, color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span>💰</span> <span>Preço Alto (Sem fit financeiro)</span>
              </button>
              <button
                type="button"
                onClick={() => handleConfirmLoss('GHOSTING')}
                className="btn-action"
                style={{
                  padding: '12px', background: 'var(--surface-raised)', border: '1px solid #F87171',
                  borderRadius: 8, color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span>🔇</span> <span>Sem Resposta (Sumido/Ghosting)</span>
              </button>
              <button
                type="button"
                onClick={() => handleConfirmLoss('MISSING_CONTENT')}
                className="btn-action"
                style={{
                  padding: '12px', background: 'var(--surface-raised)', border: '1px solid #F87171',
                  borderRadius: 8, color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span>📚</span> <span>Falta de Conteúdo Específico</span>
              </button>
              <button
                type="button"
                onClick={() => handleConfirmLoss('UNQUALIFIED')}
                className="btn-action"
                style={{
                  padding: '12px', background: 'var(--surface-raised)', border: '1px solid #F87171',
                  borderRadius: 8, color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span>🚫</span> <span>Não Qualificado (Sem CRM Fit)</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                type="button"
                onClick={() => {
                  setShowLossReasonSelection(false);
                  setLossTargetLeadId(null);
                  setLossTargetStage(null);
                }}
                className="btn-action btn-action-outline"
                style={{ padding: '8px 16px' }}
              >
                Cancelar
              </button>
            </div>
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
          <div className="card" style={{ width: '90%', maxWidth: '980px', height: '85vh', background: 'var(--surface)', padding: 24, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>
                  🎯 Lançador de Campanhas Avançadas
                </h3>
                <p className="label-sm">Siga os 3 passos para segmentar seu público, definir a equipe de atendimento e desenhar a régua.</p>
              </div>
              <button 
                onClick={() => setShowCampaignModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Stepper Header */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  style={{ 
                    flex: 1, display: 'flex', alignItems: 'center', gap: 8, 
                    color: wizardStep === s ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: wizardStep === s ? 700 : 500, fontSize: 13
                  }}
                >
                  <span style={{ 
                    display: 'inline-flex', width: 24, height: 24, borderRadius: '50%', 
                    background: wizardStep === s ? 'var(--accent)' : 'var(--surface-raised)',
                    color: wizardStep === s ? '#fff' : 'var(--text-secondary)',
                    alignItems: 'center', justifyContent: 'center', fontSize: 11
                  }}>
                    {s}
                  </span>
                  <span>{s === 1 ? 'Segmentação' : s === 2 ? 'Roteamento' : 'Régua de Relacionamento'}</span>
                </div>
              ))}
            </div>

            {/* Content Body */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
              {wizardStep === 1 && (
                <div className="animate-fadeUp" style={{ display: 'flex', gap: 24 }}>
                  <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
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
                        <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Data de Início:</label>
                        <input 
                          type="date" 
                          required
                          value={campaignStartDate} 
                          onChange={(e) => setCampaignStartDate(e.target.value)}
                          style={{
                            width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                            border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Onde Buscar (Base de Clientes):</label>
                        <select 
                          value={campaignPlansFilter}
                          onChange={(e) => setCampaignPlansFilter(e.target.value as any)}
                          style={{ width: '100%', padding: '10px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
                        >
                          <option value="all">🌐 Geral (Todos os Planos)</option>
                          <option value="pagos">💵 Planos Pagos</option>
                          <option value="cortesia">🎁 Planos Cortesia / Parcerias</option>
                        </select>
                      </div>
                      <div>
                        <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Status no DentalGO:</label>
                        <select 
                          value={campaignStatusFilter}
                          onChange={(e) => setCampaignStatusFilter(e.target.value as any)}
                          style={{ width: '100%', padding: '10px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
                        >
                          <option value="active">🟢 Assinantes Ativos</option>
                          <option value="expired">🟡 Assinantes Expirados</option>
                          <option value="canceled">🔴 Assinantes Cancelados</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, background: 'var(--surface-raised)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <input
                        type="checkbox"
                        id="excludeNurturing"
                        checked={excludeNurturing}
                        onChange={(e) => setExcludeNurturing(e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }}
                      />
                      <label htmlFor="excludeNurturing" style={{ fontSize: 12, cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                        ⚠️ <strong>Ignorar leads em esteira de recuperação/nutrição</strong> (Evita sobreposição de mensagens)
                      </label>
                    </div>

                    {campaignPlansFilter !== 'all' && (() => {
                      const filteredPlans = plansList.filter(p => {
                        if (campaignPlansFilter === 'pagos') return Number(p.price) > 100;
                        if (campaignPlansFilter === 'cortesia') return Number(p.price) <= 100;
                        return false;
                      });
                      return (
                        <div className="animate-fadeUp" style={{ marginTop: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <label className="label-sm" style={{ display: 'block', margin: 0 }}>
                              {campaignPlansFilter === 'pagos' ? 'Selecione os Planos Pagos:' : 'Selecione os Planos Cortesia:'}
                            </label>
                            {filteredPlans.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const allIds = filteredPlans.map(p => p.id);
                                  const allSelected = allIds.every(id => campaignSelectedPlans.includes(id));
                                  if (allSelected) {
                                    setCampaignSelectedPlans(campaignSelectedPlans.filter(id => !allIds.includes(id)));
                                  } else {
                                    const uniqueIds = Array.from(new Set([...campaignSelectedPlans, ...allIds]));
                                    setCampaignSelectedPlans(uniqueIds);
                                  }
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, cursor: 'pointer', padding: 0, fontWeight: 500 }}
                              >
                                {filteredPlans.map(p => p.id).every(id => campaignSelectedPlans.includes(id)) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                              </button>
                            )}
                          </div>
                          
                          {loadingPlans ? (
                            <div className="skeleton" style={{ height: 100, width: '100%', borderRadius: 8 }}></div>
                          ) : filteredPlans.length === 0 ? (
                            <div style={{ padding: 12, fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 8 }}>
                              Nenhum plano cadastrado nesta categoria.
                            </div>
                          ) : (
                            <div style={{ 
                              maxHeight: 150, 
                              overflowY: 'auto', 
                              background: 'var(--surface-raised)', 
                              border: '1px solid var(--border)', 
                              borderRadius: 8, 
                              padding: '8px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6
                            }}>
                              {filteredPlans.map((p) => {
                                const isChecked = campaignSelectedPlans.includes(p.id);
                                return (
                                  <label 
                                    key={p.id} 
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 8, 
                                      fontSize: 12, 
                                      cursor: 'pointer', 
                                      color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                                      transition: 'color 0.2s',
                                      padding: '2px 0'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setCampaignSelectedPlans([...campaignSelectedPlans, p.id]);
                                        } else {
                                          setCampaignSelectedPlans(campaignSelectedPlans.filter(id => id !== p.id));
                                        }
                                      }}
                                      style={{ accentColor: 'var(--accent)' }}
                                    />
                                    <span>{p.title}</span>
                                    <span style={{ color: 'var(--text-faint)', fontSize: 11, marginLeft: 'auto' }}>
                                      {p.price > 0 ? `R$ ${Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Cortesia'}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {campaignStatusFilter === 'expired' && (
                      <div className="animate-fadeUp">
                        <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Expirados há mais de (Dias):</label>
                        <input 
                          type="number" 
                          value={campaignExpiryDays} 
                          onChange={(e) => setCampaignExpiryDays(e.target.value)}
                          placeholder="Ex: 30"
                          style={{
                            width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                            border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Estimated Target Card */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.05), transparent)', border: '1px solid var(--accent-light)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                    <h4 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 8 }}>Público-Alvo Estimado</h4>
                    {loadingEstimate ? (
                      <div className="skeleton" style={{ height: 32, width: 120, margin: '8px 0' }}></div>
                    ) : (
                      <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent)', margin: '8px 0' }}>
                        {estimatedAudience}
                      </div>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 200 }}>
                      leads atendem às regras lógicas configuradas ao lado.
                    </p>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label className="label-sm" style={{ display: 'block', marginBottom: 8 }}>
                      Atribuição da Equipe (Selecione um ou mais operadores comerciais):
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, background: 'var(--surface-raised)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                      {teamList.map((agent: any) => {
                        const checked = campaignAgentIds.includes(agent.id);
                        return (
                          <label key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                            <input 
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                if (checked) {
                                  setCampaignAgentIds(campaignAgentIds.filter(id => id !== agent.id));
                                } else {
                                  setCampaignAgentIds([...campaignAgentIds, agent.id]);
                                }
                              }}
                              style={{ width: 16, height: 16, cursor: 'pointer' }}
                            />
                            <span>{agent.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Limitador de Leads Comercial</h4>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          Evite sobrecarregar o Alert Center das vendedoras dividindo os leads ao longo dos dias.
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="label-sm" style={{ fontSize: 11 }}>{campaignLimitEnabled ? 'Ativo' : 'Inativo'}</span>
                        <div 
                          onClick={() => setCampaignLimitEnabled(!campaignLimitEnabled)}
                          style={{
                            width: 44, height: 24, borderRadius: 12, background: campaignLimitEnabled ? 'var(--accent)' : 'var(--border)',
                            position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: 2, left: campaignLimitEnabled ? 22 : 2, transition: 'left 0.2s'
                          }}></div>
                        </div>
                      </div>
                    </div>

                    {campaignLimitEnabled && (
                      <div className="animate-fadeUp" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="label-sm">Distribuir no máximo</span>
                        <input 
                          type="number"
                          min="1"
                          value={campaignLimitPerDay}
                          onChange={(e) => setCampaignLimitPerDay(e.target.value)}
                          placeholder="Ex: 5"
                          style={{
                            width: 80, padding: '6px 12px', background: 'var(--surface-raised)',
                            border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13
                          }}
                        />
                        <span className="label-sm">leads por vendedor por dia (Round-Robin).</span>
                      </div>
                    )}
                  </div>

                  {/* Seleção de SMTP (DentalGO CRM 360) */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>📧 Servidor SMTP de Disparo</h4>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      Selecione qual servidor SMTP de disparo será associado para as mensagens de e-mail desta campanha.
                    </p>
                    <select
                      value={campaignSmtpConfigId}
                      onChange={(e) => setCampaignSmtpConfigId(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                    >
                      <option value="">-- Usar SMTP Padrão Ativo --</option>
                      {smtpConfigs.map(config => (
                        <option key={config.id} value={config.id}>{config.name} ({config.user})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>⚙️ Roteamento de Pós-Venda e Funil</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                      <div>
                        <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Funil Destino (Pipeline):</label>
                        <select
                          value={campaignPipelineId}
                          onChange={(e) => setCampaignPipelineId(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                        >
                          <option value="">-- Padrão (Vendas) --</option>
                          {pipelines.map(pipe => (
                            <option key={pipe.id} value={pipe.id}>{pipe.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Se GANHO (WON) &rarr; Mudar para:</label>
                        <select
                          value={campaignOnWinJourneyId}
                          onChange={(e) => setCampaignOnWinJourneyId(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                        >
                          <option value="">-- Nenhum (Remover da Jornada) --</option>
                          {campaignsData.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Se PERDIDO (LOST) &rarr; Mudar para:</label>
                        <select
                          value={campaignOnLoseJourneyId}
                          onChange={(e) => setCampaignOnLoseJourneyId(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                        >
                          <option value="">-- Nenhum (Remover da Jornada) --</option>
                          {campaignsData.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="animate-fadeUp" style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.5fr', gap: 16, height: '48vh' }}>
                  {/* React Flow Board */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface-raised)', position: 'relative', overflow: 'hidden' }}>
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={(changes) => {
                        setNodes(prev => {
                          const updated = [...prev];
                          for (const change of changes) {
                            if (change.type === 'position' && change.id) {
                              const idx = updated.findIndex(n => n.id === change.id);
                              if (idx !== -1 && change.position) {
                                updated[idx].position = change.position;
                              }
                            }
                          }
                          return updated;
                        });
                      }}
                      onNodeClick={(_, node) => {
                        setSelectedNodeId(node.id);
                      }}
                      fitView
                    >
                      <Controls />
                      <Background color="var(--border)" gap={16} size={1} />
                      
                      <Panel position="top-left" style={{ display: 'flex', gap: 8 }}>
                        <button 
                          type="button"
                          onClick={() => handleAddFlowStep('WHATSAPP')}
                          className="btn-action btn-action-purple"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        >
                          💬 + WhatsApp
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleAddFlowStep('CALL')}
                          className="btn-action btn-action-outline"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        >
                          📞 + Ligação
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleAddFlowStep('EMAIL')}
                          className="btn-action btn-action-neu"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        >
                          📧 + E-mail
                        </button>
                      </Panel>
                    </ReactFlow>
                  </div>

                  {/* Sidebar Node Editor */}
                  <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                      🛠️ Configuração do Passo
                    </h4>
                    {selectedNodeId && selectedNodeId !== 'start' ? (
                      (() => {
                        const nodeIndex = nodes.findIndex(n => n.id === selectedNodeId);
                        if (nodeIndex === -1) return null;
                        const node = nodes[nodeIndex];
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                            <div>
                              <span className="label-sm" style={{ fontSize: 10 }}>Canal de Ação:</span>
                              <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 13, marginTop: 2 }}>
                                {node.data.channel === 'WHATSAPP' ? '💬 WhatsApp' : node.data.channel === 'CALL' ? '📞 Ligação Telefônica' : '📧 E-mail'}
                              </div>
                            </div>

                            {node.data.channel === 'WHATSAPP' && (
                              <div>
                                <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Conector / Provedor WhatsApp:</label>
                                <select
                                  value={node.data.provider || 'EVOLUTION'}
                                  onChange={(e) => {
                                    const selectedProvider = e.target.value;
                                    setNodes(prev => {
                                      const copy = [...prev];
                                      copy[nodeIndex].data = {
                                        ...copy[nodeIndex].data,
                                        provider: selectedProvider
                                      };
                                      return copy;
                                    });
                                  }}
                                  style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                                >
                                  <option value="EVOLUTION">Evolution API (Padrão)</option>
                                  <option value="ZAPI">Z-API WhatsApp</option>
                                  <option value="META">Meta Cloud API Oficial</option>
                                </select>
                              </div>
                            )}

                            <div>
                              <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Dia de execução (Offset após entrada):</label>
                              <input 
                                type="number"
                                min="0"
                                value={node.data.dayOffset}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setNodes(prev => {
                                    const copy = [...prev];
                                    copy[nodeIndex].data = {
                                      ...copy[nodeIndex].data,
                                      dayOffset: val,
                                      label: `${node.data.channel === 'WHATSAPP' ? '💬' : node.data.channel === 'CALL' ? '📞' : '📧'} ${node.data.channel} (Dia ${val})`
                                    };
                                    return copy;
                                  });
                                }}
                                style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                              />
                            </div>

                            <div>
                              <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Selecionar Template de Mensagem:</label>
                              <select
                                value={node.data.templateId || ''}
                                onChange={(e) => {
                                  const selectedTplId = e.target.value;
                                  const selectedTpl = templatesList.find(t => t.id === selectedTplId);
                                  setNodes(prev => {
                                    const copy = [...prev];
                                    copy[nodeIndex].data = {
                                      ...copy[nodeIndex].data,
                                      templateId: selectedTplId || null,
                                      messageTemplate: selectedTpl ? selectedTpl.content : '',
                                    };
                                    return copy;
                                  });
                                }}
                                style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, marginBottom: 8 }}
                              >
                                <option value="">-- Usar texto livre abaixo --</option>
                                {templatesList
                                  .filter(t => t.type === node.data.channel)
                                  .map(t => (
                                    <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>
                                  ))
                                }
                              </select>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                              <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Conteúdo da Mensagem (Preview ou Texto Livre):</label>
                              <textarea 
                                value={node.data.messageTemplate || ''}
                                readOnly={!!node.data.templateId}
                                onChange={(e) => {
                                  setNodes(prev => {
                                    const copy = [...prev];
                                    copy[nodeIndex].data = {
                                      ...copy[nodeIndex].data,
                                      messageTemplate: e.target.value
                                    };
                                    return copy;
                                  });
                                }}
                                placeholder="Olá {{customer.fullName}}, vimos que seu plano expirou..."
                                style={{ width: '100%', flex: 1, minHeight: 120, padding: '8px 10px', background: node.data.templateId ? 'var(--surface-raised)' : 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, resize: 'none', outline: 'none' }}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
                                setEdges(prev => prev.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
                                setSelectedNodeId(null);
                              }}
                              className="btn-action btn-action-outline"
                              style={{ color: 'var(--red)', borderColor: 'var(--red-light)', fontSize: 11, padding: 6 }}
                            >
                              🗑️ Remover Passo
                            </button>
                          </div>
                        );
                      })()
                    ) : (
                      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 11, textAlign: 'center', padding: 20 }}>
                        Selecione um nó de ação na régua para editar as regras, templates e dias de atraso.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stepper Footer Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button 
                type="button" 
                onClick={() => {
                  if (wizardStep > 1) {
                    setWizardStep((wizardStep - 1) as any);
                  } else {
                    setShowCampaignModal(false);
                  }
                }} 
                className="btn-action btn-action-outline"
                style={{ padding: '8px 16px' }}
              >
                {wizardStep === 1 ? 'Cancelar' : '◀️ Voltar'}
              </button>

              <button 
                type="button" 
                onClick={async () => {
                  if (wizardStep === 1) {
                    if (!campaignName) {
                      alert('Por favor, informe o nome da campanha.');
                      return;
                    }
                    setWizardStep(2);
                  } else if (wizardStep === 2) {
                    if (campaignAgentIds.length === 0) {
                      alert('Selecione pelo menos um operador para atendimento.');
                      return;
                    }
                    if (nodes.length === 0) {
                      setNodes([
                        { id: 'start', type: 'input', data: { label: '🚀 Início: Entrada na Campanha' }, position: { x: 200, y: 50 }, deletable: false, style: { background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 8, fontWeight: 700 } }
                      ]);
                      setEdges([]);
                    }
                    setWizardStep(3);
                  } else {
                    await handleLaunchCampaignSubmit();
                  }
                }} 
                className="btn-action btn-action-purple"
                style={{ padding: '8px 20px' }}
              >
                {wizardStep === 3 ? '🚀 Lançar & Ativar Campanha' : 'Continuar ▶️'}
              </button>
            </div>
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
