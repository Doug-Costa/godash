'use client';

import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

interface Sequence {
  id: string;
  name: string;
  triggerDays: number;
  templateMessage: string;
  isActive: boolean;
  targetSegment: string;
}

interface AlertTask {
  id: string;
  externalPersonId: number;
  sequenceId: string;
  sequenceName: string;
  templateMessage: string;
  assignedToId: string | null;
  assignedToName: string | null;
  status: string;
  scheduledFor: string;
  completedAt: string | null;
  completionNote: string | null;
  snapshotPlanId: number | null;
  snapshotPlanName: string | null;
  personFullName: string;
  personEmail: string;
  personPhone: string;
  renderedMessage: string;
}

interface PostSalesContentProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function PostSalesContent({ currentUser }: PostSalesContentProps) {
  const isAdmin = currentUser?.role === 'ADMIN';

  // Tabs: 'alerts' | 'sequences'
  const [activeSubTab, setActiveSubTab] = useState<'alerts' | 'sequences'>('alerts');

  // Alerts State
  const [alerts, setAlerts] = useState<AlertTask[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Sequences State
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loadingSequences, setLoadingSequences] = useState(false);

  // Sequence Form/Editor State
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [showSeqModal, setShowSeqModal] = useState(false);
  const [seqForm, setSeqForm] = useState({
    name: '',
    triggerDays: 1,
    templateMessage: '',
    isActive: true,
    targetSegment: 'paid',
  });
  const [seqError, setSeqError] = useState<string | null>(null);

  // Completion Task Modal
  const [completingTask, setCompletingTask] = useState<AlertTask | null>(null);
  const [completionNote, setCompletionNote] = useState('');

  // Fetch alerts
  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch(`/api/post-sales/alerts?all=true`);
      if (res.ok) {
        const json = await res.json();
        setAlerts(json.alerts || []);
      }
    } catch (err) {
      console.error('Erro ao buscar alertas:', err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Fetch sequences
  const fetchSequences = async () => {
    setLoadingSequences(true);
    try {
      const res = await fetch('/api/post-sales/sequences');
      if (res.ok) {
        const json = await res.json();
        setSequences(json.sequences || []);
      }
    } catch (err) {
      console.error('Erro ao buscar sequências:', err);
    } finally {
      setLoadingSequences(false);
    }
  };

  // Sync tasks
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/post-sales/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Usa a data atual no servidor
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSyncResult(`Sincronização OK! Novas tarefas criadas: ${json.tasksCreated}`);
        fetchAlerts();
      } else {
        setSyncResult(`Erro na sincronização: ${json.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      setSyncResult(`Erro de rede: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Complete task
  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;

    try {
      const res = await fetch('/api/post-sales/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: completingTask.id,
          action: 'complete',
          note: completionNote.trim() !== '' ? completionNote : undefined,
        }),
      });

      if (res.ok) {
        setCompletingTask(null);
        setCompletionNote('');
        fetchAlerts();
      }
    } catch (err) {
      console.error('Erro ao concluir tarefa:', err);
    }
  };

  // Cancel/Skip task
  const handleCancelTask = async (taskId: string) => {
    if (!confirm('Deseja ignorar/cancelar este alerta de pós-venda?')) return;
    try {
      const res = await fetch('/api/post-sales/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          action: 'cancel',
        }),
      });

      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error('Erro ao cancelar tarefa:', err);
    }
  };

  // Open Add/Edit Sequence Modal
  const openSequenceModal = (seq: Sequence | null = null) => {
    setEditingSequence(seq);
    if (seq) {
      setSeqForm({
        name: seq.name,
        triggerDays: seq.triggerDays,
        templateMessage: seq.templateMessage,
        isActive: seq.isActive,
        targetSegment: seq.targetSegment,
      });
    } else {
      setSeqForm({
        name: '',
        triggerDays: 1,
        templateMessage: 'Olá {{nome}}! Tudo bem?\nVimos que você assinou o {{plano}} recentemente. Seja muito bem-vindo!',
        isActive: true,
        targetSegment: 'paid',
      });
    }
    setSeqError(null);
    setShowSeqModal(true);
  };

  // Submit Sequence Form
  const handleSaveSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    setSeqError(null);

    const method = editingSequence ? 'PATCH' : 'POST';
    const body = editingSequence
      ? { id: editingSequence.id, ...seqForm }
      : seqForm;

    try {
      const res = await fetch('/api/post-sales/sequences', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setShowSeqModal(false);
        fetchSequences();
      } else {
        setSeqError(json.error || 'Erro ao salvar sequência.');
      }
    } catch (err) {
      setSeqError('Erro de rede ao salvar sequência.');
    }
  };

  // Soft delete sequence (toggle isActive = false)
  const handleDeleteSequence = async (seqId: string) => {
    if (!confirm('Deseja desativar esta sequência de pós-venda?')) return;
    try {
      const res = await fetch('/api/post-sales/sequences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: seqId }),
      });

      if (res.ok) {
        fetchSequences();
      }
    } catch (err) {
      console.error('Erro ao desativar sequência:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchSequences();
  }, []);

  // WhatsApp deep-link formatter
  const getWhatsAppLink = (phone: string, text: string) => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div style={{ minHeight: '100vh', padding: '24px 24px 64px' }}>
      
      {/* Top Header Consistent Menu */}
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
            Automação de Pós-Venda &middot; <span style={{ color: 'var(--accent)' }}>v2.0</span>
          </p>
        </div>

        {/* Tab Selection */}
        <nav style={{ display: 'flex', gap: 6, background: 'var(--surface-raised)', padding: 4, borderRadius: 10 }}>
          <button 
            onClick={() => setActiveSubTab('alerts')}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: activeSubTab === 'alerts' ? 'var(--accent-glow)' : 'transparent',
              color: activeSubTab === 'alerts' ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            🔔 Alertas Pendentes ({alerts.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('sequences')}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: activeSubTab === 'sequences' ? 'var(--accent-glow)' : 'transparent',
              color: activeSubTab === 'sequences' ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            ⚙️ Configurações do Funil
          </button>
        </nav>

        {/* Navigation & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ThemeToggle />
          <button 
            onClick={() => window.location.href = '/dashboard'}
            style={{
              padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 10,
              background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            ⬅️ Voltar ao CRM
          </button>
        </div>
      </header>

      {/* RENDER CONTENT TABS */}

      {/* TAB A: ALERTS LIST */}
      {activeSubTab === 'alerts' && (
        <div className="animate-fadeUp">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>
                Fila de Pós-Venda Comercial
              </h2>
              <p className="label-sm" style={{ marginTop: 2 }}>Mensagens agendadas para novos assinantes prontas para disparo via WhatsApp.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {syncResult && (
                <span className="badge badge-cyan" style={{ padding: '8px 12px' }}>{syncResult}</span>
              )}
              <button 
                onClick={handleSync}
                disabled={syncing}
                className="btn-action btn-action-outline"
                style={{ fontSize: 12, padding: '8px 16px' }}
              >
                {syncing ? '🔄 Sincronizando...' : '⚡ Sincronizar Assinaturas'}
              </button>
            </div>
          </div>

          {loadingAlerts ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: 260, borderRadius: 16 }}></div>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '80px 24px', background: 'var(--surface)',
              border: '1px dashed var(--border)', borderRadius: 16
            }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 8 }}>Tudo limpo por aqui!</h3>
              <p className="label-sm">Nenhum alerta de pós-venda pendente ou agendado para hoje.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 16
            }}>
              {alerts.map(task => (
                <div key={task.id} className="card card-glow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 280 }}>
                  <div>
                    {/* Header info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                      <div>
                        <span className="badge badge-cyan" style={{ fontSize: 10, padding: '2px 8px', marginBottom: 6 }}>
                          💬 {task.sequenceName}
                        </span>
                        <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.05rem' }}>
                          {task.personFullName}
                        </h4>
                      </div>
                      <span className="badge badge-neu" style={{ fontSize: 10 }}>
                        {new Date(task.scheduledFor).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>Plano:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{task.snapshotPlanName || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>E-mail:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{task.personEmail || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>Telefone:</span>
                        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{task.personPhone || '—'}</span>
                      </div>
                    </div>

                    {/* Rendered Template message preview */}
                    <div style={{ position: 'relative' }}>
                      <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Mensagem para Envio:</label>
                      <textarea
                        readOnly
                        value={task.renderedMessage}
                        style={{
                          width: '100%', height: 100, padding: 10, borderRadius: 8,
                          background: 'var(--surface-raised)', border: '1px solid var(--border)',
                          color: 'var(--text-secondary)', fontSize: 12, outline: 'none', resize: 'none',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <a
                      href={getWhatsAppLink(task.personPhone, task.renderedMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-action btn-action-purple"
                      style={{ flex: 1, padding: '10px 14px', fontSize: 12, display: 'flex', justifyContent: 'center' }}
                      onClick={() => {
                        // Ao clicar para abrir o whats, pré-carrega o concluir
                        setCompletingTask(task);
                      }}
                    >
                      🟢 WhatsApp Link
                    </a>
                    <button
                      onClick={() => setCompletingTask(task)}
                      className="btn-action btn-action-outline"
                      style={{ padding: '10px 14px', fontSize: 12 }}
                    >
                      ✓ Concluir
                    </button>
                    <button
                      onClick={() => handleCancelTask(task.id)}
                      style={{
                        padding: '10px 12px', background: 'transparent', border: '1px solid var(--border)',
                        color: 'var(--red)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      title="Ignorar tarefa"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB B: SEQUENCE MANAGER */}
      {activeSubTab === 'sequences' && (
        <div className="animate-fadeUp card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div className="label">Sequências de Pós-Venda Cadastradas</div>
              <div className="label-sm">Defina os gatilhos e modelos de mensagens enviados automaticamente para os leads.</div>
            </div>
            <button 
              onClick={() => openSequenceModal(null)}
              className="btn-action btn-action-purple"
              style={{ fontSize: 12, padding: '8px 16px' }}
            >
              ＋ Criar Sequência
            </button>
          </div>

          {loadingSequences ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 20 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: 50, width: '100%' }}></div>
              ))}
            </div>
          ) : sequences.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-faint)' }}>
              Nenhuma sequência configurada. Clique em Criar Sequência para iniciar.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Gatilho (Dias)</th>
                    <th>Filtro de Clientes</th>
                    <th>Template da Mensagem</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sequences.map(seq => (
                    <tr key={seq.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{seq.name}</td>
                      <td>
                        <span className="badge badge-neu">{seq.triggerDays} {seq.triggerDays === 1 ? 'dia' : 'dias'} após</span>
                      </td>
                      <td>
                        <span className={`badge ${seq.targetSegment === 'paid' ? 'badge-cyan' : 'badge-neu'}`}>
                          {seq.targetSegment === 'paid' ? 'Apenas Pagos' : 
                           seq.targetSegment === 'all' ? 'Todos' : seq.targetSegment}
                        </span>
                      </td>
                      <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-tertiary)' }}>
                        {seq.templateMessage}
                      </td>
                      <td>
                        <span className={`badge ${seq.isActive ? 'badge-up' : 'badge-down'}`}>
                          {seq.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => openSequenceModal(seq)}
                            style={{
                              padding: '4px 8px', background: 'transparent', border: '1px solid var(--border)',
                              borderRadius: 6, color: 'var(--accent)', cursor: 'pointer', fontSize: 11
                            }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteSequence(seq.id)}
                            style={{
                              padding: '4px 8px', background: 'transparent', border: '1px solid var(--border)',
                              borderRadius: 6, color: 'var(--red)', cursor: 'pointer', fontSize: 11
                            }}
                            disabled={!seq.isActive}
                          >
                            Desativar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: CONCLUIR TAREFA ── */}
      {completingTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999, padding: 16
        }}>
          <div className="card animate-fadeUp" style={{ width: '100%', maxWidth: 460 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
              Concluir Alerta de Pós-Venda
            </h3>
            <p className="label-sm" style={{ marginBottom: 16 }}>
              Deseja salvar alguma anotação sobre o contato feito com <strong>{completingTask.personFullName}</strong>?
            </p>

            <form onSubmit={handleCompleteTask}>
              <textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="Ex: Mandou mensagem via WhatsApp, aguardando retorno sobre renovação."
                style={{
                  width: '100%', height: 100, padding: 12, borderRadius: 8,
                  background: 'var(--surface-raised)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: 13, outline: 'none', marginBottom: 16,
                  resize: 'none'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setCompletingTask(null)}
                  className="btn-action btn-action-outline"
                  style={{ fontSize: 12, padding: '8px 16px' }}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="btn-action btn-action-purple"
                  style={{ fontSize: 12, padding: '8px 16px' }}
                >
                  ✓ Concluir Alerta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CRIAR/EDITAR SEQUÊNCIA ── */}
      {showSeqModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999, padding: 16
        }}>
          <div className="card animate-fadeUp" style={{ width: '100%', maxWidth: 540 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>
              {editingSequence ? 'Editar Sequência' : 'Criar Nova Sequência'}
            </h3>

            <form onSubmit={handleSaveSequence} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Nome da Sequência:</label>
                <input
                  type="text"
                  required
                  value={seqForm.name}
                  onChange={(e) => setSeqForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Boas vindas 2 dias"
                  style={{
                    width: '100%', padding: '8px 12px', background: 'var(--surface-raised)',
                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Gatilho (Dias após Assinatura):</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={seqForm.triggerDays}
                    onChange={(e) => setSeqForm(prev => ({ ...prev, triggerDays: Number(e.target.value) }))}
                    style={{
                      width: '100%', padding: '8px 12px', background: 'var(--surface-raised)',
                      border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Segmento Alvo:</label>
                  <select
                    value={seqForm.targetSegment}
                    onChange={(e) => setSeqForm(prev => ({ ...prev, targetSegment: e.target.value }))}
                    style={{
                      width: '100%', padding: '8px 12px', background: 'var(--surface-raised)',
                      border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                    }}
                  >
                    <option value="paid">Assinaturas Pagas</option>
                    <option value="all">Qualquer Cadastro com Assinatura</option>
                    <option value="book_only">Compradores Somente de Livros</option>
                    <option value="promo">Trial / 15 dias Grátis</option>
                    <option value="courtesy">Cortesia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>
                  Mensagem do Template:
                </label>
                <textarea
                  required
                  value={seqForm.templateMessage}
                  onChange={(e) => setSeqForm(prev => ({ ...prev, templateMessage: e.target.value }))}
                  placeholder="Olá {{nome}}! Seu plano {{plano}} está ativo."
                  style={{
                    width: '100%', height: 120, padding: 10, borderRadius: 8,
                    background: 'var(--surface-raised)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontSize: 13, outline: 'none', resize: 'none'
                  }}
                />
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
                  Variáveis suportadas: <code>{"{{nome}}"}</code>, <code>{"{{plano}}"}</code>, <code>{"{{email}}"}</code>, <code>{"{{telefone}}"}</code>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={seqForm.isActive}
                  onChange={(e) => setSeqForm(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <label htmlFor="isActive" className="label-sm" style={{ cursor: 'pointer' }}>Ativar esta sequência agora</label>
              </div>

              {seqError && (
                <div style={{ color: 'var(--red)', fontSize: 12 }}>{seqError}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowSeqModal(false)}
                  className="btn-action btn-action-outline"
                  style={{ fontSize: 12, padding: '8px 16px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-action btn-action-purple"
                  style={{ fontSize: 12, padding: '8px 16px' }}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
