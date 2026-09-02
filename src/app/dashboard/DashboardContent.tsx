'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import AutomatedCampaignAnalytics from '@/components/AutomatedCampaignAnalytics';
import { NewLeadModal } from '@/components/ui/NewLeadModal';
import ProductFormModal from '@/components/ProductFormModal';
import CampaignSegmentation, { CampaignRule } from '@/components/CampaignSegmentation';
import UnifiedLeadsExplorer from '@/components/UnifiedLeadsExplorer';
import FlowManagerContent from '@/components/FlowManagerContent';
import FormsConfiguratorContent from '@/components/FormsConfiguratorContent';
import ManualSaleModal from '@/components/ManualSaleModal';
import CommercialRevOpsDashboard from '@/components/CommercialRevOpsDashboard';
import AdminImportTab from '@/components/AdminImportTab';
import { SpecialtyClassifierService } from '@/lib/services/SpecialtyClassifierService';

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
  products?: Array<{ id: string; name: string; description: string | null }>;
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
  products = [],
}: DashboardContentProps) {
  const isAdmin = currentUser?.role === 'ADMIN';
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleMonthChange = (newMonth: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', newMonth);
    params.delete('period');
    router.push(`/dashboard?${params.toString()}`);
  };

  // State Management
  const [activeTab, setActiveTab] = useState<'financeiro' | 'kanban' | 'leads' | 'team' | 'cancelados' | 'alerts' | 'campanhas' | 'atendimento' | 'flow-manager' | 'marketing-forms'>(
    isAdmin ? 'financeiro' : 'atendimento'
  );
  const [subTabFinanceiro, setSubTabFinanceiro] = useState<'product' | 'comercial'>('product');

  const [atendimentoViewMode, setAtendimentoViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [atendimentoFila, setAtendimentoFila] = useState<'alerts' | 'cancelados' | 'expirar' | 'abandonados'>('alerts');
  const [filaCounts, setFilaCounts] = useState({ alerts: 0, cancelados: 0, expirar: 0, abandonados: 0 });
  const [modalActiveTab, setModalActiveTab] = useState<'oportunidade' | 'perfil' | 'timeline360'>('oportunidade');
  
  const visiblePipelines = pipelines.filter(p => isAdmin || p.name !== 'Nutrição');
  const defaultPipeline = visiblePipelines.find(p => p.name === 'Vendas') || visiblePipelines[0];
  const [activePipelineId, setActivePipelineId] = useState<string>(defaultPipeline?.id || '');
  
  // Bulk Actions state (Admin only)
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkPipelineId, setBulkPipelineId] = useState('');
  const [bulkAssigneeId, setBulkAssigneeId] = useState('all');
  const [bulkJourneyId, setBulkJourneyId] = useState('all');
  const [bulkStage, setBulkStage] = useState('all');
  const [bulkActionType, setBulkActionType] = useState('assign'); // 'assign' | 'return_to_queue'
  const [bulkTargetAssigneeId, setBulkTargetAssigneeId] = useState('');
  const [executingBulkAction, setExecutingBulkAction] = useState(false);
  
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
  const [filterAssignee, setFilterAssignee] = useState(currentUser?.id || 'all');
  const [filterMonth, setFilterMonth] = useState(month);

  // Modals state
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [leadAssignmentHistory, setLeadAssignmentHistory] = useState<any[]>([]);
  const [timeline360Events, setTimeline360Events] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'todos' | 'atendimento' | 'sla'>('todos');
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showFastAcquisitionModal, setShowFastAcquisitionModal] = useState(false);
  const [showManualSaleModal, setShowManualSaleModal] = useState(false);
  
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
  const [metaSpecialties, setMetaSpecialties] = useState<string[]>([]);
  const [metaInterests, setMetaInterests] = useState<string[]>([]);
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
  const [lossTargetLeadId, setLossTargetLeadId] = useState<number | string | null>(null);
  const [lossTargetJourneyId, setLossTargetJourneyId] = useState<string | null>(null);
  const [lossTargetStage, setLossTargetStage] = useState<string | null>(null);
  const [lossTargetOpportunityId, setLossTargetOpportunityId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedLead) {
      const meta = selectedLead.metadata || {};
      setMetaInstagram(meta.instagram || '');
      
      const specs: string[] = Array.isArray(meta.specialties)
        ? [...meta.specialties]
        : (meta.specialty ? [meta.specialty] : []);
      const ints: string[] = Array.isArray(meta.interests)
        ? [...meta.interests]
        : (meta.interest ? [meta.interest] : []);

      // Auto-extract specialties from customerProducts bought
      if (selectedLead.customerProducts && Array.isArray(selectedLead.customerProducts)) {
        for (const cp of selectedLead.customerProducts) {
          const spec = cp.product?.specialty;
          if (spec && !specs.includes(spec)) {
            specs.push(spec);
          }
        }
      }

      setMetaSpecialties(specs);
      setMetaInterests(ints);
      setActiveRapidFireTab(null);
      setWaPasteText('');
      setEmailSubject('DentalGO - Atendimento Comercial');
      setEmailBodyText('');
    } else {
      setMetaInstagram('');
      setMetaSpecialties([]);
      setMetaInterests([]);
      setActiveRapidFireTab(null);
    }
  }, [selectedLead]);

  // Team management state
  const [teamList, setTeamList] = useState(agents);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [agentForm, setAgentForm] = useState({ name: '', email: '', password: '', role: 'AGENT', isActive: true, skills: [] as string[] });
  const [agentError, setAgentError] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productsList, setProductsList] = useState<any[]>(products);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

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
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [campaignNature, setCampaignNature] = useState<'COMMERCIAL' | 'AUTOMATED'>('COMMERCIAL');
  const [campaignCollisionCount, setCampaignCollisionCount] = useState<number>(0);
  const [campaignRules, setCampaignRules] = useState<CampaignRule[]>([]);
  const [campaignRulesRelation, setCampaignRulesRelation] = useState<'AND' | 'OR'>('AND');
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
  const [campaignRoutingMode, setCampaignRoutingMode] = useState<string>('ROUND_ROBIN');
  const [campaignUseAccountManager, setCampaignUseAccountManager] = useState<boolean>(false);
  const [campaignStrictSkillMatch, setCampaignStrictSkillMatch] = useState<boolean>(false);
  const [campaignRotationEnabled, setCampaignRotationEnabled] = useState<boolean>(false);
  const [campaignRotationInactivityDays, setCampaignRotationInactivityDays] = useState<number>(3);
  const [campaignProductId, setCampaignProductId] = useState<string>('');
  const [campaignWarmupTemplateId, setCampaignWarmupTemplateId] = useState('');
  const [campaignFlowId, setCampaignFlowId] = useState('');
  const [canonicalFlows, setCanonicalFlows] = useState<any[]>([]);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [plannedCampaignAudience, setPlannedCampaignAudience] = useState<any[]>([]);
  const [selectedTestCustomerIds, setSelectedTestCustomerIds] = useState<string[]>([]);

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
  const [adminSubTab, setAdminSubTab] = useState<'products' | 'team' | 'integrations' | 'smtp' | 'import'>('products');

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
  const fetchLeads = async (
    forcedViewMode?: 'kanban' | 'list', 
    forcedFila?: 'alerts' | 'cancelados' | 'expirar' | 'abandonados',
    forcedPipelineId?: string
  ) => {
    setLoadingLeads(true);
    try {
      const viewMode = forcedViewMode || atendimentoViewMode;
      const fila = forcedFila || atendimentoFila;
      const pipelineId = forcedPipelineId || activePipelineId;
      const monthParam = (activeTab === 'kanban' && kanbanFilterAllMonths) ? 'all' : filterMonth;
      
      const useLimit = viewMode === 'kanban' ? 1000 : leadsLimit;
      const usePage = viewMode === 'kanban' ? 1 : leadsPage;

      let url = `/api/leads?month=${monthParam}&page=${usePage}&limit=${useLimit}`;
      if (filterPlan !== 'all') {
        if (!isNaN(Number(filterPlan)) || filterPlan === 'none' || filterPlan === 'core_annual' || filterPlan === 'core_recurring') {
          url += `&plan=${filterPlan}`;
        } else {
          url += `&productCategory=${filterPlan}`;
        }
      }
      if (filterSearch.trim() !== '') url += `&search=${encodeURIComponent(filterSearch)}`;
      if (filterStage !== '') url += `&stage=${filterStage}`;
      if (filterAssignee !== 'all') url += `&assigneeId=${filterAssignee}`;
      if (pipelineId !== '') url += `&pipelineId=${pipelineId}`;
      if (activeTab === 'atendimento') {
        if (viewMode === 'list') {
          url += `&atendimentoFila=${fila}`;
        }
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
      if (filterPlan !== 'all' && (!isNaN(Number(filterPlan)) || filterPlan === 'none' || filterPlan === 'core_annual' || filterPlan === 'core_recurring')) {
        url += `&plan=${filterPlan}`;
      }
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
    if (activeTab === 'marketing-forms') {
      fetchCampaigns();
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

  // Fetch estimated audience for campaign wizard (debounced)
  useEffect(() => {
    if (!showCampaignModal) return;
    fetch('/api/flows')
      .then(response => response.ok ? response.json() : null)
      .then(json => setCanonicalFlows(json?.data || []))
      .catch(() => setCanonicalFlows([]));
    
    const delayDebounceFn = setTimeout(async () => {
      setLoadingEstimate(true);
      try {
        const res = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'estimate',
            rules: campaignRules,
            rulesRelation: campaignRulesRelation,
            excludeNurturing: excludeNurturing
          })
        });
        if (res.ok) {
          const data = await res.json();
          setEstimatedAudience(data.count || 0);
          setCampaignCollisionCount(data.collisionCount || 0);
        }
      } catch (err) {
        console.error('Failed to estimate audience:', err);
      } finally {
        setLoadingEstimate(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [campaignRules, campaignRulesRelation, excludeNurturing, showCampaignModal]);

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
  const handleDragStart = (
    e: React.DragEvent,
    leadId: number | string,
    journeyId: string | null = null,
    opportunityId: string | null = null
  ) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ leadId, journeyId, opportunityId }));
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const dragDataStr = e.dataTransfer.getData('text/plain');
    if (!dragDataStr) return;
    
    let leadId: number | string;
    let journeyId: string | null = null;
    let opportunityId: string | null = null;
    try {
      const data = JSON.parse(dragDataStr);
      leadId = data.leadId;
      journeyId = data.journeyId;
      opportunityId = data.opportunityId || null;
    } catch {
      leadId = Number(dragDataStr);
    }

    if (targetStage === 'perdido') {
      setLossTargetLeadId(leadId);
      setLossTargetJourneyId(journeyId);
      setLossTargetStage('perdido');
      setLossTargetOpportunityId(opportunityId);
      setShowLossReasonSelection(true);
      return;
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, opportunityId, journeyId, stage: targetStage }),
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
      setLossTargetOpportunityId(selectedLead.opportunity?.id || null);
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
          opportunityId: selectedLead.opportunity?.id || null,
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
  const openTimeline = async (lead: any) => {
    setSelectedLead(lead);
    setDetailNote('');
    setShowLossReasons(false);
    setShowScheduler(false);
    setScheduledDate('');
    setShowTimelineModal(true);
    setLeadAssignmentHistory([]);
    setTimeline360Events([]);
    setHistoryFilter('todos');
    try {
      const [resHistory, resEvents] = await Promise.all([
        fetch(`/api/leads/${lead.id}/history`),
        fetch(`/api/leads/${lead.id}/events`)
      ]);
      
      if (resHistory.ok) {
        const dataH = await resHistory.json();
        setLeadAssignmentHistory(dataH.data || []);
      }
      
      if (resEvents.ok) {
        const dataE = await resEvents.json();
        setTimeline360Events(dataE.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // One-click disposition handler
  const handleActionDisposition = async (type: string, lossReason?: string, scheduledFor?: string) => {
    if (!selectedLead) return;

    const autoAssign = !selectedLead.assignee && currentUser?.id && type !== 'LOST' && type !== 'RECOVERED';

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          opportunityId: selectedLead.opportunity?.id || null,
          journeyId: selectedLead.journeyId || null,
          type,
          lossReason,
          lostReason: lossReason, // Mapeamento para o novo campo do SQLite
          note: detailNote.trim() !== '' ? detailNote : undefined,
          scheduledFor,
          ...(autoAssign && { assigneeId: currentUser.id, stage: 'primeiro_contato' })
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (autoAssign || type === 'LOST' || type === 'RECOVERED') {
          setShowTimelineModal(false);
          if (autoAssign) {
            setAtendimentoViewMode('kanban');
            setActiveTab('atendimento');
          }
        } else {
          setSelectedLead((prev: any) => ({
            ...prev,
            ...json.data,
            notes: json.data.notes || [],
          }));
        }
        setDetailNote('');
        setShowLossReasons(false);
        setShowScheduler(false);
        setScheduledDate('');
        fetchLeads(autoAssign ? 'kanban' : undefined);
      }
    } catch (err) {
      console.error('Failed to register action disposition:', err);
    }
  };

  // Submit new note in Timeline modal
  const submitDetailNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || detailNote.trim() === '') return;

    const autoAssign = !selectedLead.assignee && currentUser?.id;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          opportunityId: selectedLead.opportunity?.id || null,
          journeyId: selectedLead.journeyId || null,
          note: detailNote,
          ...(autoAssign && { assigneeId: currentUser.id, stage: 'primeiro_contato' })
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (autoAssign) {
          setShowTimelineModal(false);
          setAtendimentoViewMode('kanban');
          setActiveTab('atendimento');
        } else {
          setSelectedLead((prev: any) => ({
            ...prev,
            ...json.data,
            notes: json.data.notes || [],
          }));
        }
        setDetailNote('');
        fetchLeads(autoAssign ? 'kanban' : undefined);
      }
    } catch (err) {
      console.error('Failed to save timeline note:', err);
    }
  };

  const handleDetailUpdate = async (field: 'stage' | 'assigneeId', value: string) => {
    if (field === 'stage' && value === 'perdido') {
      setLossTargetLeadId(selectedLead.id);
      setLossTargetJourneyId(selectedLead.journeyId || null);
      setLossTargetOpportunityId(selectedLead.opportunity?.id || null);
      setLossTargetStage('perdido');
      setShowLossReasonSelection(true);
      setShowTimelineModal(false);
      return;
    }

    try {
      const isAssigningToMe = field === 'assigneeId' && value === currentUser?.id;

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          opportunityId: selectedLead.opportunity?.id || null,
          journeyId: selectedLead.journeyId || null,
          [field]: value,
          ...(isAssigningToMe && { stage: 'primeiro_contato' })
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (isAssigningToMe) {
          setShowTimelineModal(false);
          setAtendimentoViewMode('kanban');
          setActiveTab('atendimento');
        } else {
          setSelectedLead((prev: any) => ({
            ...prev,
            stage: json.data.stage,
            assignee: json.data.assignee,
          }));
        }
        fetchLeads(isAssigningToMe ? 'kanban' : undefined);
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

  const handleResumeAutomation = async (personId: number, journeyId: string | null) => {
    if (!confirm('Deseja retomar as automações para este cliente e remover a trava de intervenção humana?')) return;

    try {
      const res = await fetch('/api/leads/resume-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ externalPersonId: personId, journeyId })
      });
      if (res.ok) {
        alert('Automação retomada com sucesso!');
        fetchLeads();
        if (selectedLead && selectedLead.id === personId) {
          setSelectedLead((prev: any) => ({ ...prev, humanTakeover: false }));
        }
      } else {
        alert('Erro ao retomar automação.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao retomar automação.');
    }
  };

  const handleSaveMetadata = async (inst?: string, specs?: string[], ints?: string[]) => {
    if (!selectedLead) return;
    setIsSavingMeta(true);
    const targetInst = inst !== undefined ? inst : metaInstagram;
    const targetSpecs = specs !== undefined ? specs : metaSpecialties;
    const targetInts = ints !== undefined ? ints : metaInterests;
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          journeyId: selectedLead.journeyId || null,
          metadata: {
            instagram: targetInst,
            specialties: targetSpecs,
            specialty: targetSpecs[0] || '',
            interests: targetInts
          }
        })
      });
      if (res.ok) {
        const json = await res.json();
        setSelectedLead((prev: any) => ({
          ...prev,
          metadata: json.data?.metadata || {
            ...(prev?.metadata || {}),
            instagram: targetInst,
            specialties: targetSpecs,
            interests: targetInts
          }
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
          opportunityId: lossTargetOpportunityId,
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
        const json = await res.json();
        if (json.success && json.data?.pipelineId) {
          setActivePipelineId(json.data.pipelineId);
          fetchAlerts();
          fetchLeads('kanban', undefined, json.data.pipelineId);
        } else {
          fetchAlerts();
          fetchLeads('kanban');
        }
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
            const matched = leadJson.data.find((l: any) => l.journeyId === alert.leadState.journeyId) || leadJson.data[0];
            openTimeline(matched);
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
    if (!campaignFlowId && nodes.length <= 1) {
      alert('Por favor, adicione pelo menos um passo de ação na sua régua.');
      return;
    }

    if (!confirm(`Ativar esta campanha para a audiência estimada de ${estimatedAudience} pessoa(s)? Para um ensaio seguro, use primeiro "Salvar rascunho" e "Executar teste controlado".`)) {
      return;
    }

    try {
      const flowSteps = nodes
        .filter(n => n.id !== 'start')
        .map(n => ({
          type: n.data.stepType || 'MESSAGE',
          dayOffset: Number(n.data.dayOffset) || 0,
          channel: n.data.channel,
          messageTemplate: n.data.messageTemplate || '',
          templateId: n.data.templateId || null,
          provider: n.data.provider || 'EVOLUTION',
          nextFlowId: n.data.nextFlowId || null
        }))
        .sort((a, b) => a.dayOffset - b.dayOffset);

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'launch',
          campaignId: editingCampaignId || undefined,
          name: campaignName,
          startDate: campaignStartDate,
          rules: campaignRules,
          rulesRelation: campaignRulesRelation,
          userIds: campaignAgentIds,
          limitPerDay: campaignLimitEnabled && campaignLimitPerDay ? Number(campaignLimitPerDay) : null,
          smtpConfigId: campaignSmtpConfigId || null,
          warmupTemplateId: campaignWarmupTemplateId || null,
          excludeNurturing,
          pipelineId: campaignPipelineId || null,
          onWinJourneyId: campaignOnWinJourneyId || null,
          onLoseJourneyId: campaignOnLoseJourneyId || null,
          campaignNature,
          flowId: campaignFlowId || null,
          flowSteps,
          flowGraph: JSON.stringify({ nodes, edges }),
          routingMode: campaignRoutingMode,
          useAccountManager: campaignUseAccountManager,
          strictSkillMatch: campaignStrictSkillMatch,
          productId: campaignProductId || null,
          rotationEnabled: campaignRotationEnabled,
          rotationInactivityDays: campaignRotationInactivityDays
        })
      });

      if (res.ok) {
        setCampaignName('');
        setCampaignSmtpConfigId('');
        setCampaignRules([]);
        setCampaignRulesRelation('AND');
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
        setCampaignWarmupTemplateId('');
        setExcludeNurturing(true);
        setCampaignNature('COMMERCIAL');
        setCampaignRoutingMode('ROUND_ROBIN');
        setCampaignUseAccountManager(false);
        setCampaignStrictSkillMatch(false);
        setCampaignRotationEnabled(false);
        setCampaignRotationInactivityDays(3);
        setCampaignProductId('');
        setCampaignFlowId('');
        setEditingCampaignId(null);
        setPlannedCampaignAudience([]);
        setSelectedTestCustomerIds([]);
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

  const handleSaveCanonicalCampaign = async (runTest: boolean) => {
    if (!campaignName.trim()) {
      alert('Informe o nome da campanha.');
      return;
    }
    const controlledTestIds: Array<string | number> = selectedTestCustomerIds.length
      ? selectedTestCustomerIds
      : selectedLeadIds;
    if (runTest && controlledTestIds.length === 0) {
      alert('Selecione na Audiência ao menos uma pessoa para o teste controlado.');
      return;
    }
    try {
      const flowSteps = nodes.filter(n => n.id !== 'start').map(n => ({
        type: 'MESSAGE',
        dayOffset: Number(n.data.dayOffset) || 0,
        channel: n.data.channel,
        messageTemplate: n.data.messageTemplate || '',
        templateId: n.data.templateId || null,
        provider: n.data.provider || 'EVOLUTION'
      })).sort((a, b) => a.dayOffset - b.dayOffset);
      let selectedFlowId = campaignFlowId;
      if (!selectedFlowId && flowSteps.length > 0) {
        const flowResponse = await fetch('/api/flows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${campaignName} — Fluxo`,
            category: campaignNature === 'COMMERCIAL' ? 'COMMERCIAL' : 'MARKETING',
            graph: { nodes, edges },
            steps: flowSteps,
            publish: true
          })
        });
        const flowJson = await flowResponse.json();
        if (!flowResponse.ok) throw new Error(flowJson.error || 'Falha ao salvar fluxo.');
        selectedFlowId = flowJson.data.flow.id;
      }

      const campaignResponse = await fetch('/api/campaigns/canonical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-draft',
          campaignId: editingCampaignId || undefined,
          name: campaignName,
          campaignNature,
          productId: campaignProductId || null,
          pipelineId: campaignPipelineId || null,
          flowId: selectedFlowId || null,
          targetCriteria: { rules: campaignRules, rulesRelation: campaignRulesRelation, startDate: campaignStartDate, excludeNurturing },
          routingMode: campaignRoutingMode,
          useAccountManager: campaignUseAccountManager,
          strictSkillMatch: campaignStrictSkillMatch,
          operatorIds: campaignAgentIds,
          limitPerDay: campaignLimitEnabled && campaignLimitPerDay ? Number(campaignLimitPerDay) : null,
          startsAt: campaignStartDate,
          excludeNurturing
        })
      });
      const campaignJson = await campaignResponse.json();
      if (!campaignResponse.ok) throw new Error(campaignJson.error || 'Falha ao salvar campanha.');

      if (runTest) {
        const preflightResponse = await fetch('/api/campaigns/canonical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'preflight', campaignId: campaignJson.data.id, customerIds: controlledTestIds })
        });
        const preflightJson = await preflightResponse.json();
        if (!preflightResponse.ok || !preflightJson.data?.valid) {
          throw new Error((preflightJson.data?.errors || [preflightJson.error || 'Preflight inválido.']).join(' '));
        }
        const testResponse = await fetch('/api/campaigns/canonical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'test',
            campaignId: campaignJson.data.id,
            customerIds: controlledTestIds,
            fixedAssigneeId: campaignAgentIds.length === 1 ? campaignAgentIds[0] : undefined
          })
        });
        const testJson = await testResponse.json();
        if (!testResponse.ok) throw new Error(testJson.error || 'Falha no teste controlado.');
        alert(`Teste controlado iniciado para ${testJson.count} pessoa(s).`);
      } else {
        alert('Campanha salva como rascunho. Nenhuma mensagem foi enviada.');
      }
      setShowCampaignModal(false);
      setCampaignFlowId('');
      setEditingCampaignId(null);
      fetchCampaigns();
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
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
      const isCanonical = campaignsData.find((campaign: any) => campaign.id === campaignId)?.entityType === 'CAMPAIGN';
      const res = await fetch(isCanonical ? `/api/campaigns/canonical?id=${campaignId}` : `/api/campaigns?campaignId=${campaignId}`, {
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

  const handleEditCanonicalCampaign = (campaign: any) => {
    let criteria: any = {};
    try { criteria = campaign.targetCriteria ? JSON.parse(campaign.targetCriteria) : {}; } catch { criteria = {}; }
    setEditingCampaignId(campaign.id);
    setCampaignName(campaign.name || '');
    setCampaignNature(campaign.campaignNature || 'COMMERCIAL');
    setCampaignRules(criteria.rules || []);
    setCampaignRulesRelation(criteria.rulesRelation || 'AND');
    setCampaignStartDate(criteria.startDate || new Date().toISOString().slice(0, 10));
    setExcludeNurturing(criteria.excludeNurturing !== false);
    setCampaignAgentIds((campaign.operators || []).map((operator: any) => operator.id));
    setCampaignPipelineId(campaign.pipelineId || '');
    setCampaignProductId(campaign.productId || '');
    setCampaignFlowId(campaign.flowId || '');
    setCampaignRoutingMode(campaign.routingMode || 'ROUND_ROBIN');
    setCampaignUseAccountManager(campaign.useAccountManager === true);
    setCampaignStrictSkillMatch(campaign.strictSkillMatch === true);
    setPlannedCampaignAudience(campaign.audience || []);
    setSelectedTestCustomerIds([]);
    setWizardStep(2);
    setShowCampaignModal(true);
  };

  const handleExecuteBulkAction = async () => {
    if (!confirm('Deseja realmente executar esta ação em massa nos contatos selecionados? Esta operação é irreversível.')) {
      return;
    }

    setExecutingBulkAction(true);
    try {
      const res = await fetch('/api/leads/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkActionType,
          targetAssigneeId: bulkTargetAssigneeId,
          filters: {
            pipelineId: bulkPipelineId,
            assigneeId: bulkAssigneeId,
            journeyId: bulkJourneyId,
            stage: bulkStage
          }
        })
      });

      const json = await res.json();
      if (json.success) {
        alert(`Sucesso! Ação executada com êxito. Contatos afetados: ${json.updatedCount}`);
        setShowBulkActionModal(false);
        fetchLeads();
      } else {
        alert(`Erro ao executar ação em massa: ${json.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      console.error('Error executing bulk action:', err);
      alert(`Erro de conexão ao executar ação em massa: ${err.message}`);
    } finally {
      setExecutingBulkAction(false);
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

  const handleSaveProduct = async (productData: any) => {
    try {
      const isEdit = !!productData.id;
      const res = await fetch('/api/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        // Refresh product list
        const listRes = await fetch('/api/products');
        if (listRes.ok) {
          const listJson = await listRes.json();
          setProductsList(listJson.data || []);
        }
        setEditingProduct(null);
      } else {
        alert(`Erro ao cadastrar produto: ${json.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('Failed to save product:', err);
      alert('Erro de rede ao salvar o produto.');
    }
  };

  const handleRegisterManualSale = async (saleData: any) => {
    if (!selectedLead) return;
    try {
      const payload = {
        ...saleData,
        customerId: selectedLead.id
      };
      
      const res = await fetch('/api/leads/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        // Update selectedLead locally with the new purchase and update LTV
        setSelectedLead((prev: any) => {
          if (!prev) return prev;
          const updatedCustomerProducts = [...(prev.customerProducts || []), json.data];
          const newPricePaid = json.data.pricePaid || 0;
          const updatedLTV = (prev.totalLifetimeValue || 0) + newPricePaid;
          return {
            ...prev,
            customerProducts: updatedCustomerProducts,
            totalLifetimeValue: updatedLTV
          };
        });

        // Update leads list locally as well so UI displays correct LTV and products instantly
        setLeads((prevLeads: any[]) => prevLeads.map(l => {
          if (l.id === selectedLead.id) {
            const updatedCustomerProducts = [...(l.customerProducts || []), json.data];
            const newPricePaid = json.data.pricePaid || 0;
            const updatedLTV = (l.totalLifetimeValue || 0) + newPricePaid;
            return {
              ...l,
              customerProducts: updatedCustomerProducts,
              totalLifetimeValue: updatedLTV
            };
          }
          return l;
        }));
      } else {
        alert(`Erro ao registrar venda: ${json.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('Failed to register manual sale:', err);
      alert('Erro de rede ao registrar venda.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        // Refresh product list
        const listRes = await fetch('/api/products');
        if (listRes.ok) {
          const listJson = await listRes.json();
          setProductsList(listJson.data || []);
        }
      } else {
        alert(`Erro ao excluir produto: ${json.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Erro de rede ao excluir o produto.');
    }
  };

  const openAddAgent = () => {
    setEditingAgent(null);
    setAgentForm({ name: '', email: '', password: '', role: 'AGENT', isActive: true, skills: [] });
    setAgentError(null);
    setShowTeamModal(true);
  };

  const openEditAgent = (agent: any) => {
    setEditingAgent(agent);
    setAgentForm({ name: agent.name, email: agent.email, password: '', role: agent.role, isActive: agent.isActive, skills: agent.skills || [] });
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
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setBulkPipelineId(activePipelineId || 'all');
                  setShowBulkActionModal(true);
                }}
                className="btn-action btn-action-outline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                  background: 'transparent'
                }}
              >
                ⚙️ Ações em Massa (Admin)
              </button>
            )}
          </div>

          {/* Filas de Atendimento (Row 2) */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
            <button
              type="button"
              onClick={() => setAtendimentoViewMode('kanban')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: atendimentoViewMode === 'kanban' ? 'var(--accent-glow)' : 'var(--surface)',
                borderColor: atendimentoViewMode === 'kanban' ? 'var(--accent)' : 'var(--border)',
                color: atendimentoViewMode === 'kanban' ? 'var(--accent)' : 'var(--text-secondary)'
              }}
            >
              📋 Meu Atendimento (Kanban)
            </button>

            <button
              type="button"
              onClick={() => {
                setAtendimentoViewMode('list');
                setAtendimentoFila('alerts');
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: (atendimentoViewMode === 'list' && atendimentoFila === 'alerts') ? 'var(--accent-glow)' : 'var(--surface)',
                borderColor: (atendimentoViewMode === 'list' && atendimentoFila === 'alerts') ? 'var(--accent)' : 'var(--border)',
                color: (atendimentoViewMode === 'list' && atendimentoFila === 'alerts') ? 'var(--accent)' : 'var(--text-secondary)'
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
              onClick={() => {
                setAtendimentoViewMode('list');
                setAtendimentoFila('cancelados');
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: (atendimentoViewMode === 'list' && atendimentoFila === 'cancelados') ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface)',
                borderColor: (atendimentoViewMode === 'list' && atendimentoFila === 'cancelados') ? '#EF4444' : 'var(--border)',
                color: (atendimentoViewMode === 'list' && atendimentoFila === 'cancelados') ? '#EF4444' : 'var(--text-secondary)'
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
              onClick={() => {
                setAtendimentoViewMode('list');
                setAtendimentoFila('expirar');
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: (atendimentoViewMode === 'list' && atendimentoFila === 'expirar') ? 'rgba(245, 158, 11, 0.1)' : 'var(--surface)',
                borderColor: (atendimentoViewMode === 'list' && atendimentoFila === 'expirar') ? '#F59E0B' : 'var(--border)',
                color: (atendimentoViewMode === 'list' && atendimentoFila === 'expirar') ? '#F59E0B' : 'var(--text-secondary)'
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
              onClick={() => {
                setAtendimentoViewMode('list');
                setAtendimentoFila('abandonados');
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: (atendimentoViewMode === 'list' && atendimentoFila === 'abandonados') ? 'rgba(6, 182, 212, 0.1)' : 'var(--surface)',
                borderColor: (atendimentoViewMode === 'list' && atendimentoFila === 'abandonados') ? 'var(--cyan)' : 'var(--border)',
                color: (atendimentoViewMode === 'list' && atendimentoFila === 'abandonados') ? 'var(--cyan)' : 'var(--text-secondary)'
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
              <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Categoria de Produto:</label>
              <select 
                value={filterPlan} 
                onChange={(e) => setFilterPlan(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}
              >
                <option value="all">Todas as Categorias</option>
                <option value="CURSO">🎓 Curso</option>
                <option value="CONGRESSO">🎪 Congresso</option>
                <option value="LIVRO">📘 Livro</option>
                <option value="SAAS">💻 SaaS</option>
                <option value="INSTITUCIONAL">🏢 Institucional</option>
              </select>
            </div>

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>🎯 Campanha:</label>
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



            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Competência:</label>
              <MonthSelector currentMonth={filterMonth} allowAll={true} onChange={handleMonthChange} />
            </div>
          </div>
        </div>

        {/* Abas de Funis (Pipelines) - Apenas se no Kanban */}
        {atendimentoViewMode === 'kanban' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, background: 'var(--surface-raised)', padding: 6, borderRadius: 10, width: 'fit-content', border: '1px solid var(--border)' }}>
              {visiblePipelines.map((pipeline) => (
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
            
            <button 
              onClick={() => setIsNewLeadModalOpen(true)}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Adicionar Lead
            </button>
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
              const currentPipeline = visiblePipelines.find(p => p.id === activePipelineId) || visiblePipelines[0];
              const stages = (currentPipeline && currentPipeline.stages) ? currentPipeline.stages : [
                { key: 'novo_cadastro', label: 'Novo Cadastro' },
                { key: 'primeiro_contato', label: 'Contato Inicial' },
                { key: 'em_negociacao', label: 'Em Negociação' },
                { key: 'ganho', label: 'Convertido / Ganho' },
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
                            key={lead.cardId || lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(
                              e,
                              lead.id,
                              lead.journeyId,
                              lead.opportunity?.id || null
                            )}
                            onClick={() => openTimeline(lead)}
                            style={{
                              background: 'var(--surface-raised)',
                              border: lead.hasParallelNegotiation ? '1px solid var(--red)' : '1px solid var(--border)',
                              borderRadius: 8, padding: 12, cursor: 'grab',
                              boxShadow: lead.hasParallelNegotiation ? '0 0 8px rgba(239, 68, 68, 0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
                              transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                          >
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span>{lead.fullName}</span>
                              {lead.hasParallelNegotiation && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 2, fontWeight: 'bold' }}>
                                  ⚠️ Conflito
                                </span>
                              )}
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
                              {lead.subscriptionStatus === 'lead_formulario' && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                  📝 Lead de formulário
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
                              {lead.isInNurturing && lead.leadScore >= 50 && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                  ⚡ Esquentou (Nutrição)!
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
                            {/* Product Badge (Checkpoint 3) */}
                            <div style={{ marginBottom: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {lead.opportunity?.product ? (
                                <span className="badge" style={{ 
                                  fontSize: 10, 
                                  padding: '4px 8px', 
                                  background: 'var(--surface)', 
                                  border: '1px solid var(--border)', 
                                  color: 'var(--text-primary)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  borderRadius: 6
                                }}>
                                  {lead.opportunity.product.category === 'CURSO' && '🎓'}
                                  {lead.opportunity.product.category === 'CONGRESSO' && '🎪'}
                                  {lead.opportunity.product.category === 'LIVRO' && '📘'}
                                  {lead.opportunity.product.category === 'SAAS' && '💻'}
                                  {lead.opportunity.product.category === 'INSTITUCIONAL' && '🏢'}
                                  <strong>{lead.opportunity.product.category}:</strong> {lead.opportunity.product.name}
                                </span>
                              ) : (
                                <span className="badge" style={{ 
                                  fontSize: 10, 
                                  padding: '4px 8px', 
                                  background: 'rgba(255,255,255,0.03)', 
                                  border: '1px solid var(--border)', 
                                  color: 'var(--text-muted)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  borderRadius: 6
                                }}>
                                  📦 Produto Não Definido
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                              <strong>Plano:</strong> {lead.plan ? lead.plan.title : 'Sem assinatura DentalGO'}
                            </div>
                            {(lead.subscriptionStartDate || lead.subscriptionEndDate) && (
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', gap: 4, alignItems: 'center' }}>
                                <span>📅</span>
                                {lead.subscriptionStartDate && (
                                  <span>{new Date(lead.subscriptionStartDate).toLocaleDateString('pt-BR')}</span>
                                )}
                                <span>a</span>
                                {lead.subscriptionEndDate ? (
                                  <span>{new Date(lead.subscriptionEndDate).toLocaleDateString('pt-BR')}</span>
                                ) : (
                                  <span>Sem expiração</span>
                                )}
                              </div>
                            )}
                            {lead.customerProducts && lead.customerProducts.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6, padding: '4px 6px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6, border: '1px dashed var(--border)' }}>
                                {lead.customerProducts.map((cp: any) => (
                                  <div key={cp.id} style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
                                    {cp.type === 'course' || cp.category === 'SERVICE' ? '🎓' : '📦'} <strong>{cp.name}</strong>:
                                    <div style={{ color: 'var(--text-muted)', display: 'inline-block', marginLeft: 4 }}>
                                      {cp.startDate ? new Date(cp.startDate).toLocaleDateString('pt-BR') : 'N/A'} a {cp.endDate ? new Date(cp.endDate).toLocaleDateString('pt-BR') : 'Sem expiração'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
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
                                      const json = await res.json();
                                      if (json.success && json.data?.pipelineId) {
                                        setActivePipelineId(json.data.pipelineId);
                                        setAtendimentoViewMode('kanban');
                                        setActiveTab('atendimento');
                                        fetchLeads('kanban', undefined, json.data.pipelineId);
                                      } else {
                                        setAtendimentoViewMode('kanban');
                                        setActiveTab('atendimento');
                                        fetchLeads('kanban');
                                      }
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
                        <tr key={lead.cardId || lead.id} onClick={() => openTimeline(lead)} style={{ cursor: 'pointer' }}>
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
                              {lead.subscriptionStatus === 'lead_formulario' && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                                  Lead de formulário
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
                              {lead.isInNurturing && lead.leadScore >= 50 && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 'bold' }}>
                                  ⚡ Esquentou (Nutrição)!
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
                          <td>
                            <div>{lead.plan ? lead.plan.title : 'Sem assinatura DentalGO'}</div>
                            {(lead.subscriptionStartDate || lead.subscriptionEndDate) && (
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 4, alignItems: 'center' }}>
                                <span>📅</span>
                                {lead.subscriptionStartDate && (
                                  <span>{new Date(lead.subscriptionStartDate).toLocaleDateString('pt-BR')}</span>
                                )}
                                <span>a</span>
                                {lead.subscriptionEndDate ? (
                                  <span>{new Date(lead.subscriptionEndDate).toLocaleDateString('pt-BR')}</span>
                                ) : (
                                  <span>Sem expiração</span>
                                )}
                              </div>
                            )}
                          </td>
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
                                        const json = await res.json();
                                        if (json.success && json.data?.pipelineId) {
                                          setActivePipelineId(json.data.pipelineId);
                                          setAtendimentoViewMode('kanban');
                                          setActiveTab('atendimento');
                                          fetchLeads('kanban', undefined, json.data.pipelineId);
                                        } else {
                                          setAtendimentoViewMode('kanban');
                                          setActiveTab('atendimento');
                                          fetchLeads('kanban');
                                        }
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

  const unifiedHistoryEvents = [
    ...timeline360Events.map((event: any) => ({
      ...event,
      category: ['CUSTOMER_ASSIGNED', 'CUSTOMER_ROTATED'].includes(event.type) ? 'sla' : 'atendimento'
    })),
    ...leadAssignmentHistory.map((item: any) => ({
      id: `sla-${item.id}`,
      type: 'SLA_ASSIGNMENT',
      category: 'sla',
      occurredAt: item.assignedAt,
      actorType: item.assignee?.name || 'Sistema',
      metadata: { reason: item.reason, assigneeName: item.assignee?.name }
    })),
    ...((selectedLead?.notes || []).map((item: any) => ({
      id: `interaction-${item.id}`,
      type: 'INTERACTION',
      category: 'atendimento',
      occurredAt: item.date,
      actorType: item.authorName || 'Operador',
      metadata: { text: item.text }
    })))
  ]
    .filter((event: any) => historyFilter === 'todos' || event.category === historyFilter)
    .sort((a: any, b: any) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .filter((event: any, index: number, events: any[]) => events.findIndex(other => other.id === event.id) === index);

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
              onClick={() => setActiveTab('leads')}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: activeTab === 'leads' ? 'var(--accent-glow)' : 'transparent',
                color: activeTab === 'leads' ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              👥 Audiência & Leads
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
              onClick={() => setActiveTab('flow-manager')}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: activeTab === 'flow-manager' ? 'var(--accent-glow)' : 'transparent',
                color: activeTab === 'flow-manager' ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              🔄 Central de Jornadas
            </button>
          )}

          {isAdmin && (
            <button 
              onClick={() => setActiveTab('marketing-forms')}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: activeTab === 'marketing-forms' ? 'var(--accent-glow)' : 'transparent',
                color: activeTab === 'marketing-forms' ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              📋 Formulários de Captura
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
              <MonthSelector currentMonth={filterMonth} allowAll={false} onChange={handleMonthChange} />
            </div>
          </div>

          {/* Sub-abas de BI */}
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 24 }}>
            <button
              onClick={() => setSubTabFinanceiro('product')}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: subTabFinanceiro === 'product' ? 'var(--accent-glow)' : 'transparent',
                color: subTabFinanceiro === 'product' ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              📊 Saúde do Produto (DentalGO)
            </button>
            <button
              onClick={() => setSubTabFinanceiro('comercial')}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: subTabFinanceiro === 'comercial' ? 'var(--accent-glow)' : 'transparent',
                color: subTabFinanceiro === 'comercial' ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              💰 Performance Comercial (RevOps)
            </button>
          </div>

          {subTabFinanceiro === 'product' ? (
            <>
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
            </>
          ) : (
            <div style={{ marginBottom: 24 }}>
              <CommercialRevOpsDashboard />
            </div>
          )}

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

      {/* Tab: Universal Audience & Leads Explorer */}
      {activeTab === 'leads' && (
        <div className="animate-fadeUp" style={{ width: '100%' }}>
          <UnifiedLeadsExplorer agents={agents} products={products} />
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
              <div style={{ display: 'flex', gap: 12 }}>
                <a 
                  href="/dashboard/flow-manager" 
                  className="btn-action"
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)', textDecoration: 'none' }}
                >
                  ⚙️ Fluxos de Automação
                </a>
                <button 
                  onClick={() => {
                    setEditingCampaignId(null);
                    setCampaignName('');
                    setCampaignSteps([{ dayOffset: 1, channel: 'WHATSAPP', messageTemplate: 'Olá {{nome}}, tudo bem?' }]);
                    setShowCampaignModal(true);
                  }} 
                  className="btn-action btn-action-purple"
                >
                  ➕ Nova Campanha
                </button>
              </div>
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
                        {campaign.entityType === 'CAMPAIGN' && (
                          <button onClick={() => handleEditCanonicalCampaign(campaign)} className="btn-action btn-action-outline" style={{ fontSize: 10, padding: '2px 6px' }}>✏️</button>
                        )}
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
          {selectedKpiCampaignId && campaignsData.find((c: any) => c.id === selectedKpiCampaignId)?.campaignNature === 'AUTOMATED' ? (
            <div className="card">
              <AutomatedCampaignAnalytics 
                campaignId={selectedKpiCampaignId} 
                onBack={() => setSelectedKpiCampaignId('')} 
              />
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* 4. Gerenciar Equipe (ADMIN Only) */}
      {/* 4. Administração (ADMIN Only) */}
      {activeTab === 'team' && isAdmin && (
        <div style={{ display: 'flex', gap: 32, minHeight: 'calc(100vh - 140px)', alignItems: 'stretch' }} className="animate-fadeUp">
          <style>{`
            .admin-subtab-btn:hover {
              background: var(--surface-raised) !important;
              color: var(--text-primary) !important;
            }
          `}</style>

          {/* Sidebar Interna de Navegação Administrativa */}
          <div style={{
            width: 250,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            borderRight: '1px solid var(--border)',
            paddingRight: 20,
            flexShrink: 0
          }}>
            <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Painel Admin
            </div>
            
            {[
              { id: 'products', label: '📦 Catálogo de Produtos', desc: 'Preços e produtos' },
              { id: 'team', label: '👥 Gestão de Equipe', desc: 'Colaboradores e acessos' },
              { id: 'integrations', label: '🔌 Integrações', desc: 'VoIP e WhatsApp API' },
              { id: 'smtp', label: '📧 Servidores SMTP', desc: 'Contas de disparo de email' },
              { id: 'import', label: '📥 Importação de Dados', desc: 'Carga de CSV (Breve)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAdminSubTab(tab.id as any)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 2,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: adminSubTab === tab.id ? 'var(--accent-glow)' : 'transparent',
                  color: adminSubTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease-in-out',
                  borderLeft: adminSubTab === tab.id ? '3px solid var(--accent)' : '3px solid transparent',
                  width: '100%'
                }}
                className="admin-subtab-btn"
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tab.label}</span>
                <span style={{ fontSize: 10, color: adminSubTab === tab.id ? 'var(--accent)' : 'var(--text-muted)', opacity: 0.8 }}>{tab.desc}</span>
              </button>
            ))}
          </div>

          {/* Área de Conteúdo Dinâmico */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* 1. Catálogo de Produtos */}
            {adminSubTab === 'products' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, alignItems: 'start' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="label" style={{ marginBottom: 4 }}>📦 Catálogo de Produtos (RevOps)</div>
                      <div className="label-sm">Gerencie o catálogo de produtos e preços integrados.</div>
                    </div>
                    <button 
                      onClick={() => { setEditingProduct(null); setShowProductModal(true); }} 
                      className="btn-action btn-action-purple" 
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      ➕ Novo Produto
                    </button>
                  </div>

                  <div className="table-container" style={{ overflowY: 'auto', maxHeight: '65vh' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Produto</th>
                          <th>Categoria</th>
                          <th style={{ textAlign: 'right' }}>Preço Base</th>
                          <th style={{ textAlign: 'center', width: '100px' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productsList.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                              Nenhum produto cadastrado no catálogo.
                            </td>
                          </tr>
                        ) : (
                          productsList.map((prod) => (
                            <tr key={prod.id}>
                              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                <div>{prod.name}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                  {prod.subType?.replace('_', ' ')} {prod.cohort ? `• Turma: ${prod.cohort}` : ''}
                                </div>
                              </td>
                              <td>
                                <span className="badge badge-neu" style={{ fontSize: 10, padding: '2px 6px' }}>
                                  {prod.category}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)', fontSize: 12 }}>
                                {prod.basePrice ? formatBRL(prod.basePrice * 100) : 'R$ 0,00'}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  onClick={() => { setEditingProduct(prod); setShowProductModal(true); }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', marginRight: '8px' }}
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                                  title="Excluir"
                                >
                                  ❌
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Placeholder para Futuro Formulário */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '2px dashed var(--border)', background: 'transparent', textAlign: 'center', padding: 32, minHeight: 350 }}>
                  <span style={{ fontSize: 32, marginBottom: 12 }}>✏️</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Painel de Edição Rápida</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 220 }}>
                    O formulário integrado de criação/edição rápida de produtos será acoplado nesta área em atualizações futuras.
                  </div>
                </div>
              </div>
            )}

            {/* 2. Gestão de Equipe */}
            {adminSubTab === 'team' && (
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

                <div className="table-container" style={{ overflowY: 'auto', maxHeight: '65vh' }}>
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
                            <span className={`badge ${agent.role === 'ADMIN' ? 'badge-cyan' : agent.role === 'POST_SALES' ? 'badge-purple' : 'badge-neu'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                              {agent.role === 'ADMIN' ? 'Administrador' : agent.role === 'POST_SALES' ? 'Pós-Venda' : 'Agente'}
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
            )}

            {/* 3. Integrações */}
            {adminSubTab === 'integrations' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Seção VoIP */}
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>📞 Provedor VoIP (Telefone RapidFire)</div>
                      <div className="label-sm">Configure o provedor para ligações telefônicas ativas.</div>
                    </div>
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
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>💬 WhatsApp Evolution API (Alert Center)</div>
                      <div className="label-sm">Conecte sua API de WhatsApp para automação de mensagens.</div>
                    </div>
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

                {/* Painel de Ações de Sincronia / Salvamento */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20, minHeight: 300 }}>
                  <div>
                    <div className="label">🔄 Gerenciar Conectores</div>
                    <div className="label-sm" style={{ marginTop: 8 }}>
                      Clique abaixo para salvar as configurações atuais dos conectores externos ou para sincronizar de imediato a base com o CRM.
                    </div>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleSyncCRM}
                        disabled={isSyncingCRM}
                        className="btn-action btn-action-outline"
                        style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, borderColor: 'var(--accent)', color: 'var(--accent)', flex: 1, minWidth: 140 }}
                      >
                        {isSyncingCRM ? 'Sincronizando...' : '🔄 Sincronizar CRM'}
                      </button>
                      {syncFeedback && (
                        <div style={{ color: syncFeedback.startsWith('❌') ? '#F87171' : '#4ADE80', fontSize: 11, fontWeight: 600, width: '100%', marginTop: 4 }}>
                          {syncFeedback}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                      {settingsSavedFeedback && <div style={{ color: '#4ADE80', fontSize: 13, fontWeight: 600 }}>✓ Configurações Salvas com sucesso!</div>}
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                        className="btn-action btn-action-purple"
                        style={{ padding: '10px 24px', fontSize: 13, borderRadius: 8, width: '100%' }}
                      >
                        {savingSettings ? 'Salvando...' : '💾 Salvar Configurações'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Servidores SMTP */}
            {adminSubTab === 'smtp' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
                {/* SMTP Padrão */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div className="label">📧 Servidor SMTP Padrão (E-mail RapidFire)</div>
                    <div className="label-sm" style={{ marginTop: 4 }}>Configure a conta padrão para envios do sistema.</div>
                  </div>

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

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
                      {settingsSavedFeedback && <span style={{ color: '#4ADE80', fontSize: 12, fontWeight: 600 }}>✓ Salvo!</span>}
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                        className="btn-action btn-action-purple"
                        style={{ padding: '8px 20px', fontSize: 12, borderRadius: 8 }}
                      >
                        {savingSettings ? 'Salvando...' : '💾 Salvar Padrão'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Multiplos SMTPs */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div className="label">📧 Servidores SMTP do Sistema</div>
                    <div className="label-sm" style={{ marginTop: 4 }}>Cadastre múltiplos servidores SMTP de disparo para campanhas.</div>
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

                  <div className="table-container" style={{ overflowY: 'auto', maxHeight: '30vh', marginTop: 10 }}>
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
              </div>
            )}

            {/* 5. Importação de Dados */}
            {adminSubTab === 'import' && (
              <AdminImportTab
                products={productsList}
                pipelines={pipelines}
                onImportCompleted={() => {
                  fetchLeads();
                }}
              />
            )}

          </div>
        </div>
      )}

      {activeTab === 'flow-manager' && (isAdmin || currentUser?.role === 'POST_SALES') && (
        <div className="animate-fadeUp">
          <FlowManagerContent currentUser={currentUser} initialPipelines={pipelines} initialProducts={products} isTab={true} />
        </div>
      )}

      {activeTab === 'marketing-forms' && isAdmin && (
        <div className="animate-fadeUp">
          <FormsConfiguratorContent 
            currentUser={currentUser} 
            pipelines={pipelines.map(p => ({ id: p.id, name: p.name }))}
            campaigns={campaignsData.filter((c: any) => c.entityType === 'CAMPAIGN' && c.status === 'ACTIVE').map(c => ({ id: c.id, name: c.name }))}
            journeys={campaignsData.filter((c: any) => c.entityType === 'LEGACY_JOURNEY').map(c => ({ id: c.id, name: c.name }))}
            agents={agents.map(agent => ({ id: agent.id, name: agent.name }))}
            products={products.map(p => ({ id: p.id, name: p.name }))}
            isTab={true}
          />
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
          <div className="card" style={{ width: '100%', maxWidth: '1100px', background: 'var(--surface)', padding: 24, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                    Ficha de Atendimento Comercial
                  </h3>
                  <span style={{
                    background: 'rgba(74, 222, 128, 0.12)',
                    color: '#4ADE80',
                    border: '1px solid rgba(74, 222, 128, 0.3)',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    💰 LTV: {selectedLead.totalLifetimeValue !== undefined ? selectedLead.totalLifetimeValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                  </span>
                </div>
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
                  <span>&bull;</span>
                  <span>📅 Cadastrado em: {selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  {selectedLead.isBookPurchase && (
                    <>
                      <span>&bull;</span>
                      <span style={{ 
                        background: 'rgba(236, 72, 153, 0.12)', 
                        color: '#EC4899', 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        fontWeight: 'bold', 
                        fontSize: '0.75rem',
                        border: '1px solid rgba(236, 72, 153, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        📖 Comprou Livro
                      </span>
                    </>
                  )}
                  {selectedLead.humanTakeover && (
                    <>
                      <span>&bull;</span>
                      <span style={{ 
                        background: 'var(--danger-light, #fee2e2)', 
                        color: 'var(--danger, #dc2626)', 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        fontWeight: 600, 
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        🛑 Automação Pausada (Humano)
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleResumeAutomation(selectedLead.id, selectedLead.journeyId); }}
                          style={{
                            background: 'none', border: 'none', color: 'var(--danger)', 
                            textDecoration: 'underline', cursor: 'pointer', fontSize: '0.75rem', padding: 0
                          }}
                        >
                          Retomar
                        </button>
                      </span>
                    </>
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

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <button
                onClick={() => setModalActiveTab('oportunidade')}
                style={{
                  padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: modalActiveTab === 'oportunidade' ? '2px solid var(--accent)' : '2px solid transparent',
                  color: modalActiveTab === 'oportunidade' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                Atendimento
              </button>
              <button
                onClick={() => setModalActiveTab('perfil')}
                style={{
                  padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: modalActiveTab === 'perfil' ? '2px solid var(--accent)' : '2px solid transparent',
                  color: modalActiveTab === 'perfil' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                Cliente 360
              </button>
              <button 
                onClick={() => setModalActiveTab('timeline360')}
                style={{
                  padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: modalActiveTab === 'timeline360' ? '2px solid var(--accent)' : '2px solid transparent',
                  color: modalActiveTab === 'timeline360' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                Histórico
              </button>
            </div>

            {modalActiveTab === 'oportunidade' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, flex: 1, minHeight: 0, marginTop: 16 }}>
              {/* Left Column: Actions & Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingRight: 8 }}>
                {/* Quick selectors Row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0,
              padding: 16, background: 'var(--surface-raised)', borderRadius: 12
            }}>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Ações Rápidas de Atendimento:</label>
                {!showLossReasons && !showScheduler ? (
                  <>
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

                    <div style={{ marginTop: 12, width: '100%' }}>
                      <div style={{ padding: '8px 12px', background: 'var(--surface-raised)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, width: '100%', boxSizing: 'border-box' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>⚙️ <strong>Status RevOps:</strong></span>
                        <span className="badge" style={{ 
                          fontSize: 10, padding: '2px 8px', borderRadius: 12, fontWeight: 700,
                          background: selectedLead.isInNurturing ? 'rgba(124, 58, 237, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                          color: selectedLead.isInNurturing ? '#7C3AED' : 'var(--cyan)',
                          border: selectedLead.isInNurturing ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid var(--cyan)'
                        }}>
                          {selectedLead.isInNurturing ? '♻️ Em Nutrição' : '🎯 Em Campanha (Comercial)'}
                        </span>
                      </div>
                    </div>
                  </>
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
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0,
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
                      handleSaveMetadata(metaInstagram, metaSpecialties, metaInterests);
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)' }}>
                    🎓 Especialidades / Formações:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {metaSpecialties.length === 0 ? (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nenhuma especialidade confirmada.</span>
                    ) : (
                      metaSpecialties.map((spec) => (
                        <span key={spec} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6,
                          background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#818CF8', fontSize: 11, fontWeight: 600
                        }}>
                          <span>{SpecialtyClassifierService.getSpecialtyIcon(spec)}</span>
                          <span>{SpecialtyClassifierService.getSpecialtyLabel(spec)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = metaSpecialties.filter(s => s !== spec);
                              setMetaSpecialties(updated);
                              handleSaveMetadata(metaInstagram, updated, metaInterests);
                            }}
                            style={{ background: 'none', border: 'none', color: '#818CF8', cursor: 'pointer', fontSize: 12, padding: 0, marginLeft: 2 }}
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !metaSpecialties.includes(val)) {
                        const updated = [...metaSpecialties, val];
                        setMetaSpecialties(updated);
                        handleSaveMetadata(metaInstagram, updated, metaInterests);
                      }
                    }}
                    style={{
                      width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, outline: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value="">➕ Adicionar especialidade...</option>
                    {SpecialtyClassifierService.getAllSpecialties().map(s => (
                      <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                </div>

                {metaInterests.length > 0 && (
                  <div>
                    <label className="label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>
                      🎯 Áreas de Interesse / Desejo:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {metaInterests.map((interest) => (
                        <span key={interest} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6,
                          background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.3)',
                          color: '#FBBF24', fontSize: 11, fontWeight: 600
                        }}>
                          <span>🎯</span>
                          <span>{SpecialtyClassifierService.getSpecialtyLabel(interest)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = metaInterests.filter(i => i !== interest);
                              setMetaInterests(updated);
                              handleSaveMetadata(metaInstagram, metaSpecialties, updated);
                            }}
                            style={{ background: 'none', border: 'none', color: '#FBBF24', cursor: 'pointer', fontSize: 12, padding: 0, marginLeft: 2 }}
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
              borderRadius: 12, padding: 16, marginBottom: 0
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
                              stage: selectedLead.stage,
                              journeyId: selectedLead.journeyId || null
                            })
                          });
                          if (res.ok) {
                            setWaPasteText('');
                            // Reload timeline
                            const leadsRes = await fetch(`/api/leads?leadId=${selectedLead.id}`);
                            if (leadsRes.ok) {
                              const json = await leadsRes.json();
                              if (json.data && json.data.length > 0) {
                                const matched = json.data.find((l: any) => l.journeyId === selectedLead.journeyId) || json.data[0];
                                setSelectedLead(matched);
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
                              leadId: selectedLead.customerCuid || selectedLead.id,
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
                                const matched = json.data.find((l: any) => l.journeyId === selectedLead.journeyId) || json.data[0];
                                setSelectedLead(matched);
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
                              leadId: selectedLead.customerCuid || selectedLead.id
                            })
                          });
                          if (res.ok) {
                            // Reload timeline
                            const leadsRes = await fetch(`/api/leads?leadId=${selectedLead.id}`);
                            if (leadsRes.ok) {
                              const json = await leadsRes.json();
                              if (json.data && json.data.length > 0) {
                                 const matched = json.data.find((l: any) => l.journeyId === selectedLead.journeyId) || json.data[0];
                                 setSelectedLead(matched);
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
              </div>

              {/* Right Column: History Timeline & Note Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderLeft: '1px solid var(--border)', paddingLeft: 24, minHeight: 0 }}>
                {/* Timeline Notes Area */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                  <div className="label" style={{ marginBottom: 12 }}>Histórico de Interações (Timeline)</div>
                  <Timeline key={selectedLead.id + '-' + (selectedLead.journeyId || 'none')} events={selectedLead.notes || []} />
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

            {modalActiveTab === 'perfil' && (
              <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Cliente 360</h4>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Cadastro, assinatura e tudo que este cliente já adquiriu.</div>
                  </div>
                  <button type="button" onClick={() => setShowManualSaleModal(true)} className="btn-action btn-action-purple" style={{ padding: '8px 14px', fontSize: 12 }}>
                    + Registrar venda
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Dados Cadastrais */}
                  <div style={{ background: 'var(--surface-raised)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                    <h5 style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 13 }}>DADOS CADASTRAIS</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div><strong style={{ color: 'var(--text-primary)' }}>Nome:</strong> {selectedLead.fullName}</div>
                      <div><strong style={{ color: 'var(--text-primary)' }}>Email:</strong> {selectedLead.email || 'N/A'}</div>
                      <div><strong style={{ color: 'var(--text-primary)' }}>Telefone:</strong> {selectedLead.phoneNumber || 'N/A'}</div>
                      <div><strong style={{ color: 'var(--text-primary)' }}>Origem:</strong> {selectedLead.source || 'ORGÂNICO'}</div>
                      <div><strong style={{ color: 'var(--text-primary)' }}>Data de Cadastro:</strong> {selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                      {selectedLead.plan && (
                        <>
                          <div><strong style={{ color: 'var(--text-primary)' }}>Plano Ativo:</strong> {selectedLead.plan.title}</div>
                          {selectedLead.subscriptionStartDate && (
                            <div><strong style={{ color: 'var(--text-primary)' }}>Início da Assinatura:</strong> {new Date(selectedLead.subscriptionStartDate).toLocaleDateString('pt-BR')}</div>
                          )}
                          {selectedLead.subscriptionEndDate && (
                            <div><strong style={{ color: 'var(--text-primary)' }}>Expiração da Assinatura:</strong> {new Date(selectedLead.subscriptionEndDate).toLocaleDateString('pt-BR')}</div>
                          )}
                        </>
                      )}
                      {selectedLead.isBookPurchase && (
                        <div style={{
                          marginTop: 8,
                          padding: '8px 12px',
                          background: 'rgba(236, 72, 153, 0.08)',
                          border: '1px solid rgba(236, 72, 153, 0.2)',
                          borderRadius: 6,
                          color: '#EC4899',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <span>📖</span> Cliente comprou Livro / E-book
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Produtos Adquiridos */}
                  <div style={{ background: 'var(--surface-raised)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                    <h5 style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 13 }}>PRODUTOS / PLANOS ATIVOS</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(!selectedLead.customerProducts || selectedLead.customerProducts.length === 0) ? (
                        <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
                          Nenhum produto ou serviço ativo registrado
                        </div>
                      ) : (
                        selectedLead.customerProducts.map((cp: any) => {
                          const isService = cp.category === 'SERVICE';
                          const themeColor = isService ? '#60A5FA' : '#4ADE80';
                          const bgAlpha = isService ? 'rgba(96, 165, 250, 0.1)' : 'rgba(74, 222, 128, 0.1)';
                          
                          return (
                            <div 
                              key={cp.id}
                              style={{ 
                                padding: 12, 
                                background: bgAlpha, 
                                border: `1px solid ${themeColor}`, 
                                borderRadius: 8, 
                                color: themeColor, 
                                fontWeight: 600,
                                fontSize: 13
                              }}
                            >
                              {isService ? '🎓' : '📦'} {cp.name || 'Produto sem nome'} 
                              {cp.pricePaid !== undefined && cp.pricePaid !== null && (
                                <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 6, opacity: 0.8 }}>
                                  ({(cp.pricePaid).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                                </span>
                              )}
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400, marginTop: 4 }}>
                                {isService ? 'Contratado em' : 'Ativo desde'} {cp.startDate ? new Date(cp.startDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
                                {cp.endDate && ` a ${new Date(cp.endDate).toLocaleDateString('pt-BR')}`}
                                {cp.status && <span style={{ marginLeft: 6, textTransform: 'uppercase', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>{cp.status}</span>}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
                
              </div>
            )}

            {modalActiveTab === 'timeline360' && (
              <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Histórico do cliente</h4>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Conversas, mudanças comerciais e repasses em ordem cronológica.</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {([
                      ['todos', 'Tudo'],
                      ['atendimento', 'Atendimento'],
                      ['sla', 'Repasses / SLA']
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setHistoryFilter(value)}
                        className={historyFilter === value ? 'btn-action btn-action-purple' : 'btn-action btn-action-outline'}
                        style={{ padding: '6px 12px', fontSize: 11 }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {unifiedHistoryEvents.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nada registrado neste filtro.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                    {/* Vertical line */}
                    <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, background: 'var(--border)', zIndex: 0 }}></div>
                    
                    {unifiedHistoryEvents.map((ev: any, idx: number) => {
                      let icon = '📌';
                      let color = 'var(--text-secondary)';
                      let title = ev.type;
                      let desc = '';

                      if (ev.type === 'OPPORTUNITY_CREATED') { icon = '🚀'; color = 'var(--accent)'; title = 'Oportunidade Criada'; desc = `Funil: ${ev.metadata?.pipelineId || 'N/A'}`; }
                      if (ev.type === 'OPPORTUNITY_STAGE_CHANGED') { icon = '🔄'; color = '#EAB308'; title = 'Mudança de Estágio'; desc = `${ev.metadata?.fromStage || '?'} ➔ ${ev.metadata?.toStage || '?'}`; }
                      if (ev.type === 'CUSTOMER_ASSIGNED') { icon = '👤'; color = '#3B82F6'; title = 'Operador Atribuído'; desc = ev.metadata?.reason || 'Atribuição Inicial'; }
                      if (ev.type === 'CUSTOMER_ROTATED') { icon = '⏳'; color = '#EF4444'; title = 'Rodízio por Inatividade (SLA)'; desc = `Inatividade: ${ev.metadata?.inactivityDays || '?'} dias`; }
                      if (ev.type === 'SLA_ASSIGNMENT') { icon = '👤'; color = '#3B82F6'; title = `Responsável: ${ev.metadata?.assigneeName || 'Sistema'}`; desc = ev.metadata?.reason || 'Atribuição ou repasse'; }
                      if (ev.type === 'INTERACTION') { icon = '💬'; color = '#10B981'; title = 'Interação registrada'; desc = ev.metadata?.text || ''; }

                      return (
                        <div key={ev.id || idx} style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 1, paddingBottom: 16 }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface-raised)', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                            {icon}
                          </div>
                          <div style={{ background: 'var(--surface-raised)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div>
                                <h5 style={{ color: color, fontSize: 14, margin: 0, fontWeight: 700 }}>{title}</h5>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                                  Por: <span style={{ color: 'var(--text-primary)' }}>{ev.actorType || 'Sistema'}</span>
                                </div>
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {new Date(ev.occurredAt).toLocaleString('pt-BR')}
                              </div>
                            </div>
                            {desc && (
                              <div style={{ fontSize: 13, color: 'var(--text-primary)', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid var(--border)' }}>
                                {desc}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL: Cadastro de Produto (RevOps) */}
      {/* ====================================================================== */}
      <ProductFormModal
        isOpen={showProductModal}
        onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
        campaigns={campaignsData.filter((campaign: any) => campaign.entityType === 'CAMPAIGN' && campaign.status === 'ACTIVE')}
      />

      {/* ====================================================================== */}
      {/* MODAL: Registro de Venda Manual */}
      {/* ====================================================================== */}
      <ManualSaleModal
        isOpen={showManualSaleModal}
        onClose={() => setShowManualSaleModal(false)}
        onSave={handleRegisterManualSale}
        products={productsList}
      />

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
                  <option value="POST_SALES">Equipe de Pós-Vendas</option>
                  <option value="ADMIN">Administrador (Acesso total)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input 
                  type="checkbox"
                  id="agent-active-checkbox"
                  checked={agentForm.isActive}
                  onChange={(e) => setAgentForm({ ...agentForm, isActive: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="agent-active-checkbox" style={{ fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Usuário Ativo (Pode receber e gerenciar leads)
                </label>
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Especialidades / Skills (Produtos):</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--surface-raised)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', maxHeight: '120px', overflowY: 'auto' }}>
                  {products.length === 0 ? (
                    <span className="label-sm" style={{ color: 'var(--text-muted)' }}>Nenhum produto cadastrado.</span>
                  ) : (
                    products.map(prod => {
                      const hasSkill = agentForm.skills && agentForm.skills.includes(prod.id);
                      return (
                        <label key={prod.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-primary)', cursor: 'pointer' }}>
                          <input 
                            type="checkbox"
                            checked={hasSkill}
                            onChange={() => {
                              const newSkills = hasSkill
                                ? agentForm.skills.filter(id => id !== prod.id)
                                : [...(agentForm.skills || []), prod.id];
                              setAgentForm({ ...agentForm, skills: newSkills });
                            }}
                            style={{ width: 14, height: 14, cursor: 'pointer' }}
                          />
                          <span>{prod.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
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
              <button
                type="button"
                onClick={() => handleConfirmLoss('DISCARD')}
                className="btn-action"
                style={{
                  padding: '12px', background: 'var(--surface-raised)', border: '1px solid #F87171',
                  borderRadius: 8, color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span>🗑️</span> <span>Descarte (Hacker / Usuário de Testes)</span>
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
            {(() => {
              const steps = [
                { num: 1, label: 'Natureza' },
                { num: 2, label: 'Segmentação' },
                ...(campaignNature === 'COMMERCIAL' ? [{ num: 3, label: 'Roteamento' }] : []),
                { num: 4, label: 'Régua de Relacionamento' }
              ];
              return (
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                  {steps.map((st, idx) => (
                    <div 
                      key={st.num} 
                      style={{ 
                        flex: 1, display: 'flex', alignItems: 'center', gap: 8, 
                        color: wizardStep === st.num ? 'var(--accent)' : 'var(--text-secondary)',
                        fontWeight: wizardStep === st.num ? 700 : 500, fontSize: 13
                      }}
                    >
                      <span style={{ 
                        display: 'inline-flex', width: 24, height: 24, borderRadius: '50%', 
                        background: wizardStep === st.num ? 'var(--accent)' : 'var(--surface-raised)',
                        color: wizardStep === st.num ? '#fff' : 'var(--text-secondary)',
                        alignItems: 'center', justifyContent: 'center', fontSize: 11
                      }}>
                        {idx + 1}
                      </span>
                      <span>{st.label}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Content Body */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
              {wizardStep === 1 && (
                <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>Qual é o tipo de campanha que deseja lançar?</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Escolha o motor de atendimento ideal para o seu objetivo comercial ou de marketing.</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Comercial Card */}
                    <div 
                      onClick={() => setCampaignNature('COMMERCIAL')}
                      style={{ 
                        background: campaignNature === 'COMMERCIAL' ? 'rgba(124, 58, 237, 0.08)' : 'var(--surface-raised)',
                        border: campaignNature === 'COMMERCIAL' ? '2px solid var(--accent)' : '2px solid var(--border)',
                        borderRadius: 16, padding: 24, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center'
                      }}
                    >
                      <span style={{ fontSize: 36 }}>🎯</span>
                      <div>
                        <h5 style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', margin: 0 }}>Campanha Comercial (Ativa)</h5>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                          Direciona os leads qualificados automaticamente para o funil Kanban de vendas do time comercial. Exige atribuição de operadores.
                        </p>
                      </div>
                    </div>

                    {/* Automatica Card */}
                    <div 
                      onClick={() => setCampaignNature('AUTOMATED')}
                      style={{ 
                        background: campaignNature === 'AUTOMATED' ? 'rgba(124, 58, 237, 0.08)' : 'var(--surface-raised)',
                        border: campaignNature === 'AUTOMATED' ? '2px solid var(--accent)' : '2px solid var(--border)',
                        borderRadius: 16, padding: 24, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center'
                      }}
                    >
                      <span style={{ fontSize: 36 }}>🤖</span>
                      <div>
                        <h5 style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', margin: 0 }}>Campanha Automática (Marketing/Nutrição)</h5>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                          100% automatizada pelo robô de régua de relacionamento. Envia e-mails e WhatsApp sem envolver equipe comercial no Kanban.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <CampaignSegmentation
                  campaignName={campaignName}
                  onChangeName={setCampaignName}
                  campaignStartDate={campaignStartDate}
                  onChangeStartDate={setCampaignStartDate}
                  rules={campaignRules}
                  onChangeRules={setCampaignRules}
                  rulesRelation={campaignRulesRelation}
                  onChangeRelation={setCampaignRulesRelation}
                  excludeNurturing={excludeNurturing}
                  onChangeExcludeNurturing={setExcludeNurturing}
                  estimatedAudience={estimatedAudience}
                  collisionCount={campaignCollisionCount}
                  loadingEstimate={loadingEstimate}
                  productsList={productsList}
                />
              )}

              {wizardStep === 3 && (
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

                  {/* Seleção de Aquecimento */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>🚀 Aquecimento / Pré-Contato Automático</h4>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      Envie uma mensagem automática de boas-vindas antes de enviar o lead ao operador.
                    </p>
                    <select
                      value={campaignWarmupTemplateId}
                      onChange={(e) => setCampaignWarmupTemplateId(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                    >
                      <option value="">-- Nenhum (Direto para o Comercial, Sem Aquecimento) --</option>
                      {templatesList.map(t => (
                        <option key={t.id} value={t.id}>[{t.type}] {t.name} (v{t.version})</option>
                      ))}
                    </select>
                  </div>

                  {/* Configuração de Roteamento Inteligente (RevOps) */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>⚙️ Roteamento Dinâmico (RevOps)</h4>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      Configure como os leads comerciais ou de pós-venda serão direcionados.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                      <div>
                        <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Modo de Distribuição:</label>
                        <select
                          value={campaignRoutingMode}
                          onChange={(e) => setCampaignRoutingMode(e.target.value as any)}
                          style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                        >
                          <option value="ROUND_ROBIN">Rodízio Automático (Round-Robin)</option>
                          <option value="POOL">Fila de Espera (POOL / Pegada Manual)</option>
                        </select>
                      </div>
                      <div>
                        <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Produto da Campanha:</label>
                        <select
                          value={campaignProductId}
                          onChange={(e) => setCampaignProductId(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                        >
                          <option value="">-- Nenhum --</option>
                          {products.map(prod => (
                            <option key={prod.id} value={prod.id}>{prod.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                        <input 
                          type="checkbox"
                          checked={campaignUseAccountManager}
                          onChange={(e) => setCampaignUseAccountManager(e.target.checked)}
                          style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                        <span>Priorizar Account Manager (Histórico)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                        <input 
                          type="checkbox"
                          checked={campaignStrictSkillMatch}
                          onChange={(e) => setCampaignStrictSkillMatch(e.target.checked)}
                          style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                        <span>Exigir Especialista (Skills Match)</span>
                      </label>
                    </div>

                    <div style={{ marginTop: 24, padding: 16, background: 'var(--surface-raised)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <h4 style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 12 }}>⏰ Rotatividade Automática de Leads (SLA)</h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                        <input 
                          type="checkbox"
                          checked={campaignRotationEnabled}
                          onChange={(e) => setCampaignRotationEnabled(e.target.checked)}
                          style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                        <span>Habilitar Redistribuição por Inatividade</span>
                      </label>
                      {campaignRotationEnabled && (
                        <div style={{ marginTop: 12 }}>
                          <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Dias de inatividade para perda do Lead:</label>
                          <input
                            type="number"
                            min="1"
                            value={campaignRotationInactivityDays}
                            onChange={(e) => setCampaignRotationInactivityDays(Number(e.target.value))}
                            style={{ width: '150px', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                          />
                        </div>
                      )}
                    </div>
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
                          {visiblePipelines.map(pipe => (
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

              {wizardStep === 4 && (
                <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '52vh' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, alignItems: 'center' }}>
                    <label className="label-sm">Usar fluxo publicado:</label>
                    <select
                      value={campaignFlowId}
                      onChange={event => setCampaignFlowId(event.target.value)}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                    >
                      <option value="">-- Desenhar um fluxo exclusivo abaixo --</option>
                      {canonicalFlows.filter(flow => flow.versions?.some((version: any) => version.status === 'PUBLISHED')).map(flow => (
                        <option key={flow.id} value={flow.id}>{flow.name} (v{flow.versions?.[0]?.version || 1})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.5fr', gap: 16, flex: 1, minHeight: 0, opacity: campaignFlowId ? 0.45 : 1, pointerEvents: campaignFlowId ? 'none' : 'auto' }}>
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

                            {node.data.channel === 'EMAIL' && (
                              <div>
                                <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Servidor SMTP:</label>
                                <select
                                  value={node.data.smtpConfigId || ''}
                                  onChange={(e) => {
                                    const selectedSmtp = e.target.value;
                                    setNodes(prev => {
                                      const copy = [...prev];
                                      copy[nodeIndex].data = {
                                        ...copy[nodeIndex].data,
                                        smtpConfigId: selectedSmtp || null
                                      };
                                      return copy;
                                    });
                                  }}
                                  style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                                >
                                  <option value="">-- SMTP Ativo Padrão --</option>
                                  {smtpConfigs.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
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
                </div>
              )}
            </div>

            {wizardStep === 4 && editingCampaignId && plannedCampaignAudience.length > 0 && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginTop: 12, background: 'var(--surface-raised)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                  Audiência planejada ({plannedCampaignAudience.length}) — selecione quem receberá o teste
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto' }}>
                  {plannedCampaignAudience.map(member => (
                    <label key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <input
                        type="checkbox"
                        checked={selectedTestCustomerIds.includes(member.customerId)}
                        onChange={(event) => setSelectedTestCustomerIds(current => event.target.checked
                          ? [...current, member.customerId]
                          : current.filter(id => id !== member.customerId))}
                      />
                      <span>{member.name || 'Contato sem nome'}{member.email ? ` — ${member.email}` : ''}</span>
                    </label>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                  O teste cria uma inscrição isolada. Os demais contatos continuam apenas planejados e a campanha não é ativada para eles.
                </div>
              </div>
            )}

            {/* Stepper Footer Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button 
                type="button" 
                onClick={() => {
                  if (wizardStep === 4) {
                    if (campaignNature === 'AUTOMATED') {
                      setWizardStep(2);
                    } else {
                      setWizardStep(3);
                    }
                  } else if (wizardStep > 1) {
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

              {wizardStep === 4 && (
                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', marginRight: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleSaveCanonicalCampaign(false)}
                    className="btn-action btn-action-outline"
                    style={{ padding: '8px 14px' }}
                  >
                    💾 Salvar rascunho
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveCanonicalCampaign(true)}
                    className="btn-action btn-action-outline"
                    style={{ padding: '8px 14px', color: 'var(--accent)', borderColor: 'var(--accent)' }}
                  >
                    🧪 Executar teste controlado
                  </button>
                </div>
              )}

              <button 
                type="button" 
                onClick={async () => {
                  if (wizardStep === 1) {
                    setWizardStep(2);
                  } else if (wizardStep === 2) {
                    if (!campaignName) {
                      alert('Por favor, informe o nome da campanha.');
                      return;
                    }
                    if (campaignNature === 'COMMERCIAL') {
                      setWizardStep(3);
                    } else {
                      if (nodes.length === 0) {
                        setNodes([
                          { id: 'start', type: 'input', data: { label: '🚀 Início: Entrada na Campanha' }, position: { x: 200, y: 50 }, deletable: false, style: { background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 8, fontWeight: 700 } }
                        ]);
                        setEdges([]);
                      }
                      setWizardStep(4);
                    }
                  } else if (wizardStep === 3) {
                    if (nodes.length === 0) {
                      setNodes([
                        { id: 'start', type: 'input', data: { label: '🚀 Início: Entrada na Campanha' }, position: { x: 200, y: 50 }, deletable: false, style: { background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 8, fontWeight: 700 } }
                      ]);
                      setEdges([]);
                    }
                    setWizardStep(4);
                  } else {
                    await handleLaunchCampaignSubmit();
                  }
                }} 
                className="btn-action btn-action-purple"
                style={{ padding: '8px 20px' }}
              >
                {wizardStep === 4 ? '🚀 Lançar & Ativar Campanha' : 'Continuar ▶️'}
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

      {/* ====================================================================== */}
      {/* MODAL 6: Ações em Massa (Admin Only) */}
      {/* ====================================================================== */}
      {showBulkActionModal && isAdmin && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '95%', maxWidth: '600px', background: 'var(--surface)', padding: 24, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                ⚙️ Executar Ações em Massa
              </h3>
              <button 
                onClick={() => setShowBulkActionModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer', padding: 0 }}
              >
                &times;
              </button>
            </div>

            {/* Content / Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4 style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>1. Filtrar Contatos</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Funil (Pipeline):</label>
                  <select 
                    value={bulkPipelineId} 
                    onChange={(e) => setBulkPipelineId(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                  >
                    <option value="all">Todos os Funis</option>
                    {visiblePipelines.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Estágio (Stage):</label>
                  <select 
                    value={bulkStage} 
                    onChange={(e) => setBulkStage(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                  >
                    <option value="all">Todos os Estágios</option>
                    <option value="novo_cadastro">Novo Cadastro (Etapa 1)</option>
                    <option value="primeiro_contato">Contato Inicial (Etapa 2)</option>
                    <option value="em_negociacao">Em Negociação (Etapa 3)</option>
                    <option value="ganho">Convertido / Ganho (Etapa 4)</option>
                    <option value="perdido">Perdido / Descarte (Etapa 5)</option>
                  </select>
                </div>

                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Responsável Atual:</label>
                  <select 
                    value={bulkAssigneeId} 
                    onChange={(e) => setBulkAssigneeId(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                  >
                    <option value="all">Todos os Operadores</option>
                    <option value="unassigned">Sem Responsável (Não Atribuído)</option>
                    {teamList.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Campanha (Jornada):</label>
                  <select 
                    value={bulkJourneyId} 
                    onChange={(e) => setBulkJourneyId(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                  >
                    <option value="all">Todas as Campanhas</option>
                    <option value="none">Nenhuma Campanha (Fila Geral)</option>
                    {campaignsData.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>2. Ação a ser executada</h4>
                
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Ação:</label>
                  <select 
                    value={bulkActionType} 
                    onChange={(e) => setBulkActionType(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                  >
                    <option value="assign">Atribuir / Transferir para operador</option>
                    <option value="return_to_queue">Retornar para a fila original (Remover do Kanban e Desatribuir)</option>
                  </select>
                </div>

                {bulkActionType === 'assign' && (
                  <div>
                    <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Novo Operador Responsável:</label>
                    <select 
                      value={bulkTargetAssigneeId} 
                      onChange={(e) => setBulkTargetAssigneeId(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                    >
                      <option value="">-- Selecione o Operador --</option>
                      <option value="unassign">Remover Atribuição (Tornar Sem Responsável)</option>
                      {teamList.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Warning panel */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 8, padding: 12, color: '#D97706', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4
            }}>
              <span style={{ fontWeight: 'bold' }}>⚠️ Atenção e Confirmação:</span>
              <span>Esta ação modificará permanentemente múltiplos contatos que correspondam exatamente aos filtros selecionados acima. Certifique-se de que os filtros estão corretos antes de prosseguir.</span>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button 
                type="button" 
                onClick={() => setShowBulkActionModal(false)}
                className="btn-action btn-action-outline"
                style={{ padding: '8px 16px' }}
                disabled={executingBulkAction}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleExecuteBulkAction}
                className="btn-action btn-action-purple"
                style={{ padding: '8px 16px', background: 'var(--red)', border: '1px solid var(--red)' }}
                disabled={executingBulkAction || (bulkActionType === 'assign' && !bulkTargetAssigneeId)}
              >
                {executingBulkAction ? 'Executando...' : '🔥 Executar Ação em Massa'}
              </button>
            </div>

          </div>
        </div>
      )}

      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onLeadAdded={() => {
          fetchLeads('kanban');
          fetchKpis(); // Updates counts
        }}
        pipelines={pipelines}
      />

    </div>
  );
}
