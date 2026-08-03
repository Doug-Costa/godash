'use client';

import { useState, useEffect } from 'react';
import { ReactFlow, MiniMap, Controls, Background, Panel, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ThemeToggle from '@/components/ThemeToggle';
import TemplateLibraryModal from '@/components/ui/TemplateLibraryModal';

interface FlowManagerContentProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  initialPipelines?: any[];
}

export default function FlowManagerContent({ currentUser, initialPipelines = [] }: FlowManagerContentProps) {
  const isAdmin = currentUser?.role === 'ADMIN';

  // Tabs: 'marketing' | 'commercial' | 'cs' | 'nurturing'
  const [activeTab, setActiveTab] = useState<'marketing' | 'commercial' | 'cs' | 'nurturing'>('marketing');

  // Flows list
  const [flows, setFlows] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>(initialPipelines);
  const [smtpConfigs, setSmtpConfigs] = useState<any[]>([]);
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Flow Wizard Modal (ReactFlow Canvas Editor)
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState('');
  const [flowPipelineId, setFlowPipelineId] = useState('');
  const [flowSmtpConfigId, setFlowSmtpConfigId] = useState('');
  const [flowOnWinJourneyId, setFlowOnWinJourneyId] = useState('');
  const [flowOnLoseJourneyId, setFlowOnLoseJourneyId] = useState('');

  // React Flow states
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Template Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Pipelines are now passed as props and initialized in state

      // Fetch SMTPs
      const smtpRes = await fetch('/api/settings/smtp');
      if (smtpRes.ok) {
        const smtpData = await smtpRes.json();
        setSmtpConfigs(smtpData.configs || []);
      }

      // Fetch Templates
      const tplRes = await fetch('/api/settings/templates');
      if (tplRes.ok) {
        const tplData = await tplRes.json();
        setTemplatesList(tplData.data || []);
      }

      // Fetch Journeys/Flows
      const journeyRes = await fetch('/api/campaigns');
      if (journeyRes.ok) {
        const journeyData = await journeyRes.json();
        setFlows(journeyData.data || []);
      }
    } catch (err) {
      console.error('Error fetching flow manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Classify journeys into the 4 tabs based on their pipeline name or objective
  const getTabFlows = () => {
    return flows.filter(f => {
      // Find pipeline name
      const pipe = pipelines.find(p => p.id === f.pipelineId);
      const pipeName = pipe?.name || '';
      
      if (activeTab === 'cs') {
        return pipeName === 'CS';
      }
      if (activeTab === 'nurturing') {
        return pipeName === 'Nutrição';
      }
      if (activeTab === 'commercial') {
        return pipeName === 'Vendas';
      }
      // Marketing defaults to everything else (empty pipeline, other pipelines, etc.)
      return pipeName !== 'CS' && pipeName !== 'Nutrição' && pipeName !== 'Vendas';
    });
  };

  // Setup initial nodes for visual flow canvas
  const initVisualFlowCanvas = (flowData?: any) => {
    if (flowData && flowData.flowGraph) {
      try {
        const parsed = JSON.parse(flowData.flowGraph);
        setNodes(parsed.nodes || []);
        setEdges(parsed.edges || []);
      } catch (err) {
        console.error('Failed to parse flow graph:', err);
        setNodes([{ id: 'start', type: 'input', data: { label: '🏁 Início do Fluxo' }, position: { x: 250, y: 5 }, style: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700 } }]);
        setEdges([]);
      }
    } else {
      // Default initial structure
      setNodes([
        { id: 'start', type: 'input', data: { label: '🏁 Início do Fluxo' }, position: { x: 250, y: 5 }, style: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700 } }
      ]);
      setEdges([]);
    }
    setSelectedNodeId(null);
  };

  // Add flow node
  const addStepNode = (channel: 'WHATSAPP' | 'EMAIL' | 'CALL') => {
    const id = `node-${Date.now()}`;
    const parentNode = nodes[nodes.length - 1];
    const newY = parentNode ? parentNode.position.y + 100 : 100;
    
    const icon = channel === 'WHATSAPP' ? '💬' : channel === 'CALL' ? '📞' : '📧';
    const label = `${icon} Novo Passo ${channel} (Dia 1)`;

    const newNode = {
      id,
      data: { 
        label,
        channel,
        dayOffset: 1,
        messageTemplate: '',
        templateId: null,
        provider: channel === 'WHATSAPP' ? 'EVOLUTION' : 'INTERNAL_SMTP'
      },
      position: { x: 250, y: newY },
      style: { background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: 10, fontSize: 11, width: 180 }
    };

    const newEdge = {
      id: `edge-${parentNode.id}-${id}`,
      source: parentNode.id,
      target: id,
      animated: true,
      style: { stroke: 'var(--accent)' },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent)' }
    };

    setNodes(prev => [...prev, newNode]);
    setEdges(prev => [...prev, newEdge]);
    setSelectedNodeId(id);
  };

  // Open creation flow
  const handleCreateNewFlow = () => {
    setEditingFlowId(null);
    setFlowName('');
    setFlowPipelineId(
      activeTab === 'cs' 
        ? (pipelines.find(p => p.name === 'CS')?.id || '') 
        : activeTab === 'nurturing'
        ? (pipelines.find(p => p.name === 'Nutrição')?.id || '')
        : activeTab === 'commercial'
        ? (pipelines.find(p => p.name === 'Vendas')?.id || '')
        : ''
    );
    setFlowSmtpConfigId('');
    setFlowOnWinJourneyId('');
    setFlowOnLoseJourneyId('');
    initVisualFlowCanvas();
    setShowFlowModal(true);
  };

  // Open edit flow
  const handleEditFlow = (flow: any) => {
    setEditingFlowId(flow.id);
    setFlowName(flow.name);
    setFlowPipelineId(flow.pipelineId || '');
    setFlowSmtpConfigId(flow.smtpConfigId || '');
    setFlowOnWinJourneyId(flow.onWinJourneyId || '');
    setFlowOnLoseJourneyId(flow.onLoseJourneyId || '');
    initVisualFlowCanvas(flow);
    setShowFlowModal(true);
  };

  // Delete flow
  const handleDeleteFlow = async (id: string) => {
    if (!confirm('Deseja realmente deletar esta jornada?')) return;
    try {
      const res = await fetch(`/api/campaigns?campaignId=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete flow:', err);
    }
  };

  // Save visual flow graph
  const handleSaveFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flowName.trim()) {
      alert('O nome do fluxo é obrigatório.');
      return;
    }

    try {
      const flowSteps = nodes
        .filter(n => n.id !== 'start')
        .map(n => ({
          dayOffset: Number(n.data.dayOffset) || 0,
          channel: n.data.channel,
          messageTemplate: n.data.messageTemplate || '',
          templateId: n.data.templateId || null,
          provider: n.data.provider || (n.data.channel === 'WHATSAPP' ? 'EVOLUTION' : 'INTERNAL_SMTP')
        }))
        .sort((a, b) => a.dayOffset - b.dayOffset);

      const bodyPayload = {
        action: editingFlowId ? 'update' : 'save-flow',
        campaignId: editingFlowId || undefined,
        name: flowName,
        pipelineId: flowPipelineId || null,
        smtpConfigId: flowSmtpConfigId || null,
        onWinJourneyId: flowOnWinJourneyId || null,
        onLoseJourneyId: flowOnLoseJourneyId || null,
        flowSteps,
        flowGraph: JSON.stringify({ nodes, edges })
      };

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        setShowFlowModal(false);
        fetchData();
      } else {
        const errData = await res.json();
        alert(`Erro: ${errData.error}`);
      }
    } catch (err) {
      console.error('Failed to save static flow:', err);
    }
  };

  const tabFlows = getTabFlows();

  return (
    <div className="dashboard-layout" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '16px 24px', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            🔄 Central de Jornadas <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)', background: 'var(--surface-raised)', padding: '4px 10px', borderRadius: 20 }}>RevOps Engine</span>
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Crie, edite e organize visualmente seus fluxos e réguas de aquecimento, CS (onboarding) e nutrição de leads.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setShowTemplateModal(true)}
            className="btn-action"
            style={{ padding: '8px 16px', fontSize: 13, background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
          >
            📚 Biblioteca de Templates
          </button>
          <ThemeToggle />
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="btn-action btn-action-outline"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            ◀️ Ir para o Kanban
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 1 }}>
        <button
          onClick={() => setActiveTab('marketing')}
          style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            borderBottom: activeTab === 'marketing' ? '3px solid var(--accent)' : '3px solid transparent',
            color: activeTab === 'marketing' ? 'var(--accent)' : 'var(--text-secondary)',
            transition: 'all 0.2s'
          }}
        >
          🌊 Fluxos de Marketing (Aquecimento)
        </button>
        <button
          onClick={() => setActiveTab('commercial')}
          style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            borderBottom: activeTab === 'commercial' ? '3px solid var(--accent)' : '3px solid transparent',
            color: activeTab === 'commercial' ? 'var(--accent)' : 'var(--text-secondary)',
            transition: 'all 0.2s'
          }}
        >
          🎯 Fluxos Comerciais (Vendas Ativas)
        </button>
        <button
          onClick={() => setActiveTab('cs')}
          style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            borderBottom: activeTab === 'cs' ? '3px solid var(--accent)' : '3px solid transparent',
            color: activeTab === 'cs' ? 'var(--accent)' : 'var(--text-secondary)',
            transition: 'all 0.2s'
          }}
        >
          🚀 Fluxos de Pós-Venda (Onboarding/CS)
        </button>
        <button
          onClick={() => setActiveTab('nurturing')}
          style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            borderBottom: activeTab === 'nurturing' ? '3px solid var(--accent)' : '3px solid transparent',
            color: activeTab === 'nurturing' ? 'var(--accent)' : 'var(--text-secondary)',
            transition: 'all 0.2s'
          }}
        >
          ♻️ Fluxos de Nutrição (Recuperação/Lost)
        </button>

        <button 
          onClick={handleCreateNewFlow}
          className="btn-action btn-action-purple"
          style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: 13 }}
        >
          ➕ Criar Novo Fluxo
        </button>
      </div>

      {/* List content */}
      <div className="card" style={{ padding: 20 }}>
        {loading ? (
          <div className="skeleton" style={{ height: 120, width: '100%' }}></div>
        ) : tabFlows.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-faint)', border: '1px dashed var(--border)', borderRadius: 12 }}>
            Nenhum fluxo configurado nesta aba. Clique em <strong>"Criar Novo Fluxo"</strong> para iniciar.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {tabFlows.map(flow => (
              <div key={flow.id} style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, transition: 'transform 0.2s', cursor: 'pointer' }} onClick={() => handleEditFlow(flow)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{flow.name}</span>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleEditFlow(flow)}
                      className="btn-action btn-action-outline"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDeleteFlow(flow.id)}
                      className="btn-action btn-action-outline"
                      style={{ padding: '4px 8px', fontSize: 11, borderColor: 'var(--red-light)', color: 'var(--red)' }}
                    >
                      🗑️ Deletar
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <div>
                    <strong>Etapas do Fluxo:</strong> {flow.flowSteps?.length || 0} passos configurados.
                  </div>
                  <div>
                    <strong>Canais ativos:</strong> {Array.from(new Set(flow.flowSteps?.map((s: any) => s.channel) || [])).join(' + ') || 'Nenhum'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Canvas Canvas Flow Creator Modal */}
      {showFlowModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-scaleUp" style={{ width: '90vw', height: '90vh', display: 'flex', flexDirection: 'column', padding: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
                  {editingFlowId ? '✏️ Editar Desenho da Régua' : '🆕 Desenhar Novo Fluxo / Jornada'}
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Configure as réguas e mensagens do fluxo que será disparado pelo motor automático.
                </p>
              </div>
              <button 
                onClick={() => setShowFlowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSaveFlow} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Nome da Régua / Fluxo:</label>
                  <input
                    type="text"
                    required
                    value={flowName}
                    onChange={e => setFlowName(e.target.value)}
                    placeholder="Ex: Régua Nutrição Expirados 30 Dias"
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Funil de Destino (Pipeline):</label>
                  <select
                    value={flowPipelineId}
                    onChange={e => setFlowPipelineId(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                  >
                    {pipelines.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Conector SMTP (Opcional):</label>
                  <select
                    value={flowSmtpConfigId}
                    onChange={e => setFlowSmtpConfigId(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                  >
                    <option value="">-- SMTP Ativo Padrão --</option>
                    {smtpConfigs.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roteamento de Finais se CS ou Comercial */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: 'var(--surface-raised)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Se GANHO (WON) &rarr; Mudar para:</label>
                  <select
                    value={flowOnWinJourneyId}
                    onChange={e => setFlowOnWinJourneyId(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
                  >
                    <option value="">-- Nenhum --</option>
                    {flows.filter(f => f.id !== editingFlowId).map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Se PERDIDO (LOST) &rarr; Mudar para:</label>
                  <select
                    value={flowOnLoseJourneyId}
                    onChange={e => setFlowOnLoseJourneyId(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
                  >
                    <option value="">-- Nenhum --</option>
                    {flows.filter(f => f.id !== editingFlowId).map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Canvas reactflow area */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '3fr 1.5fr', gap: 16, minHeight: 0 }}>
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
                    <MiniMap />
                    <Background gap={12} size={1} />
                    <Panel position="top-right" style={{ display: 'flex', gap: 6 }}>
                      <button type="button" onClick={() => addStepNode('WHATSAPP')} className="btn-action" style={{ fontSize: 11, padding: '4px 8px' }}>💬 +Whats</button>
                      <button type="button" onClick={() => addStepNode('EMAIL')} className="btn-action" style={{ fontSize: 11, padding: '4px 8px' }}>📧 +Email</button>
                    </Panel>
                  </ReactFlow>
                </div>

                {/* Sidebar configuration */}
                <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                  <h4 style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: 0 }}>
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
                              {node.data.channel === 'WHATSAPP' ? '💬 WhatsApp' : node.data.channel === 'CALL' ? '📞 Ligação' : '📧 E-mail'}
                            </div>
                          </div>

                          {node.data.channel === 'WHATSAPP' && (
                            <div>
                              <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Provedor WhatsApp:</label>
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
                                <option value="EVOLUTION">Evolution API</option>
                                <option value="ZAPI">Z-API WhatsApp</option>
                                <option value="META">Meta Cloud API</option>
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Dia de execução (Delay):</label>
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
                                    label: `${node.data.channel === 'WHATSAPP' ? '💬' : '📧'} ${node.data.channel} (Dia ${val})`
                                  };
                                  return copy;
                                });
                              }}
                              style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                            />
                          </div>

                          <div>
                            <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Template:</label>
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
                              style={{ width: '100%', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}
                            >
                              <option value="">-- Texto Livre abaixo --</option>
                              {templatesList
                                .filter(t => t.type === node.data.channel)
                                .map(t => (
                                  <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>
                                ))
                              }
                            </select>
                          </div>

                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Mensagem:</label>
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
                              style={{ width: '100%', flex: 1, padding: '8px 10px', background: node.data.templateId ? 'var(--surface-raised)' : 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, resize: 'none', outline: 'none' }}
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
                      Selecione um nó no canvas para editar suas configurações.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowFlowModal(false)}
                  className="btn-action btn-action-outline"
                  style={{ fontSize: 13, padding: '10px 20px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-action btn-action-purple"
                  style={{ fontSize: 13, padding: '10px 20px' }}
                >
                  💾 Salvar Jornada Estática
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modals */}
      <TemplateLibraryModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onTemplateCreated={() => {
          // Re-fetch templates list when a new template is created
          fetch('/api/settings/templates').then(r => r.json()).then(d => setTemplatesList(d.data || []));
        }}
      />
    </div>
  );
}
