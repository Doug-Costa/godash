'use client';

import React, { useState } from 'react';

interface ReviewItem {
  id: string;
  incomingSource: string;
  incomingExternalId: string;
  confidenceScore: number;
  evidences: string[];
  status: string;
  createdAt: string;
  submission: {
    name: string | null;
    email: string | null;
    phone: string | null;
    rawData?: any;
  };
  candidatePerson: {
    id: string;
    fullName: string | null;
    email: string | null;
    phoneNumber: string | null;
    secondaryEmail?: string | null;
    secondaryPhone?: string | null;
    existingOpportunities?: Array<{
      id: string;
      stage: string;
      productName: string;
      productCategory: string | null;
    }>;
  } | null;
}

interface IdentityReviewTabProps {
  reviews: ReviewItem[];
  loading: boolean;
  onRefresh: () => void;
  onLink: (reviewId: string, personId: string) => Promise<void>;
  onSeparate: (reviewId: string) => Promise<void>;
  onDefer: (reviewId: string) => Promise<void>;
  onUpdateCanonical: (personId: string, data: { fullName?: string; email?: string; phoneNumber?: string }) => Promise<void>;
  onMerge: (sourcePersonId: string, targetPersonId: string, reason: string, overrides?: any) => Promise<void>;
}

export default function IdentityReviewTab({
  reviews = [],
  loading,
  onRefresh,
  onLink,
  onSeparate,
  onDefer,
  onUpdateCanonical,
  onMerge
}: IdentityReviewTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal: Editar Canônico
  const [editingPerson, setEditingPerson] = useState<{ id: string; fullName: string; email: string; phoneNumber: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Modal: Mesclar Pessoas
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [mergeReason, setMergeReason] = useState('Unificação assistida de pessoas duplicadas');
  const [overrideName, setOverrideName] = useState('');
  const [overrideEmail, setOverrideEmail] = useState('');
  const [overridePhone, setOverridePhone] = useState('');

  const openEditModal = (person: any) => {
    setEditingPerson({
      id: person.id,
      fullName: person.fullName || '',
      email: person.email || '',
      phoneNumber: person.phoneNumber || ''
    });
    setEditName(person.fullName || '');
    setEditEmail(person.email || '');
    setEditPhone(person.phoneNumber || '');
  };

  const handleSaveEdit = async () => {
    if (!editingPerson) return;
    setProcessingId('edit');
    try {
      await onUpdateCanonical(editingPerson.id, {
        fullName: editName.trim() || undefined,
        email: editEmail.trim() || undefined,
        phoneNumber: editPhone.trim() || undefined
      });
      setEditingPerson(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleExecuteMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeSourceId.trim() || !mergeTargetId.trim()) {
      alert('Informe os IDs da pessoa a ser absorvida (Origem) e da pessoa sobrevivente (Destino).');
      return;
    }
    setProcessingId('merge');
    try {
      await onMerge(mergeSourceId.trim(), mergeTargetId.trim(), mergeReason, {
        fullName: overrideName.trim() || undefined,
        email: overrideEmail.trim() || undefined,
        phoneNumber: overridePhone.trim() || undefined
      });
      setShowMergeModal(false);
      setMergeSourceId('');
      setMergeTargetId('');
      setOverrideName('');
      setOverrideEmail('');
      setOverridePhone('');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = reviews.length;
  const highConfidenceCount = reviews.filter(r => r.confidenceScore >= 80).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header com Ações Globais */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🆔</span> Resolução de Identidades & Fila HITL
            <span className="badge badge-neu" style={{ fontSize: 11, background: 'var(--accent)', color: '#fff' }}>
              {pendingCount} Pendente{pendingCount !== 1 ? 's' : ''}
            </span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            Revise submissões ambíguas, aprove o vínculo à identidade canônica existente, mantenha cadastros separados ou execute fusão com auditoria.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowMergeModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface-raised)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ⚡ Mesclar Pessoas (Merge)
          </button>
          
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            🔄 {loading ? 'Atualizando...' : 'Atualizar Fila'}
          </button>
        </div>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Total em Revisão</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{pendingCount}</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Alta Probabilidade (&ge;80%)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981', marginTop: 4 }}>{highConfidenceCount}</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Status do Motor</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)', marginTop: 8 }}>
            ✓ Ranking Ponderado Ativo
          </div>
        </div>
      </div>

      {/* Lista de Revisões Pendentes */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          Carregando fila de identidades...
        </div>
      ) : reviews.length === 0 ? (
        <div style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px dashed rgba(16, 185, 129, 0.3)',
          borderRadius: 12,
          padding: 40,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            Nenhuma colisão ou ambiguidade pendente!
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Todas as submissões de formulários recentes foram unificadas ou criadas com alta precisão canônica.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviews.map((r) => {
            const isProcessing = processingId === r.id;
            const scoreColor = r.confidenceScore >= 80 ? '#10B981' : r.confidenceScore >= 50 ? '#F59E0B' : '#EF4444';

            return (
              <div
                key={r.id}
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                {/* Header do Card com Origem e Score */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                      📝 Entrada: {r.incomingSource}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      ID: {r.incomingExternalId}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      • {new Date(r.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: `${scoreColor}15`,
                      color: scoreColor,
                      border: `1px solid ${scoreColor}35`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      Confiança: {r.confidenceScore}%
                    </span>
                  </div>
                </div>

                {/* Evidências */}
                {r.evidences && r.evidences.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Sinais detectados:</span>
                    {r.evidences.map((ev, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {ev.includes('EXACT') && '✓ '}
                        {ev.includes('SIMILARITY') && '~ '}
                        {ev.includes('DUMMY') && '⚠️ '}
                        {ev}
                      </span>
                    ))}
                  </div>
                )}

                {/* Comparativo: Submissão do Form vs Pessoa Candidata */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                  {/* Coluna 1: Dados Recebidos no Form */}
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      📋 Nova Submissão Recebida
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      👤 {r.submission.name || 'Sem nome informado'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      📧 {r.submission.email || 'Sem e-mail'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      📞 {r.submission.phone || 'Sem telefone'}
                    </div>
                  </div>

                  {/* Coluna 2: Candidato Sugerido */}
                  <div style={{
                    background: 'var(--surface)',
                    border: r.candidatePerson ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        🎯 Identidade Canônica Provável
                      </span>
                      {r.candidatePerson && (
                        <button
                          type="button"
                          onClick={() => openEditModal(r.candidatePerson)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent)',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          ✎ Editar Canônico
                        </button>
                      )}
                    </div>

                    {r.candidatePerson ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          👤 {r.candidatePerson.fullName || 'Sem nome canônico'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          📧 {r.candidatePerson.email || 'Sem e-mail'}
                          {r.candidatePerson.secondaryEmail && (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>
                              (Alt: {r.candidatePerson.secondaryEmail})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          📞 {r.candidatePerson.phoneNumber || 'Sem telefone'}
                          {r.candidatePerson.secondaryPhone && (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>
                              (Alt: {r.candidatePerson.secondaryPhone})
                            </span>
                          )}
                        </div>

                        {/* Cursos / Oportunidades existentes da pessoa */}
                        {r.candidatePerson.existingOpportunities && r.candidatePerson.existingOpportunities.length > 0 && (
                          <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Cursos atuais:</span>
                            {r.candidatePerson.existingOpportunities.map((opp, oIdx) => (
                              <span
                                key={oIdx}
                                style={{
                                  fontSize: 10,
                                  background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid var(--border)',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  color: 'var(--text-secondary)'
                                }}
                              >
                                🎓 {opp.productName}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                        Nenhum candidato direto encontrado. Recomendado manter como cadastro autônomo.
                      </div>
                    )}
                  </div>
                </div>

                {/* Barra de Ações Decisórias */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', paddingTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => onDefer(r.id)}
                    disabled={isProcessing}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ⏳ Adiar Decisão
                  </button>

                  <button
                    type="button"
                    onClick={() => onSeparate(r.id)}
                    disabled={isProcessing}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Manter Separado (Pessoa Nova)
                  </button>

                  {r.candidatePerson && (
                    <button
                      type="button"
                      onClick={() => onLink(r.id, r.candidatePerson!.id)}
                      disabled={isProcessing}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: 'none',
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)'
                      }}
                    >
                      ✓ Aprovar Vínculo à Pessoa Canônica
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Editar Pessoa Canônica */}
      {editingPerson && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 24,
            width: '100%',
            maxWidth: 450,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              ✎ Definir Valores Canônicos Oficiais
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              Estes campos serão a verdade absoluta desta pessoa em todo o CRM, relatórios e Kanban.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Nome Canônico Completo
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: 13
                  }}
                  placeholder="Ex: Douglas Henrique Costa Eugenio"
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  E-mail Principal Oficial
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: 13
                  }}
                  placeholder="Ex: douglas.henriuque@gmail.com"
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Telefone / WhatsApp Principal
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: 13
                  }}
                  placeholder="Ex: +5544988496436"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setEditingPerson(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={processingId === 'edit'}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {processingId === 'edit' ? 'Salvando...' : 'Salvar Dados Canônicos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Fusão de Identidades (Merge Persons) */}
      {showMergeModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <form
            onSubmit={handleExecuteMergeSubmit}
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 500,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              ⚡ Fusão de Identidades (Merge)
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              Consolide duas pessoas em uma só. Todas as oportunidades, históricos, compras, tarefas e aliases serão transferidos para a pessoa de destino com registro de auditoria.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  ID da Pessoa a ser absorvida (Origem / Será arquivada) *
                </label>
                <input
                  type="text"
                  required
                  value={mergeSourceId}
                  onChange={(e) => setMergeSourceId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: 13
                  }}
                  placeholder="ID da Person a ser mesclada..."
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  ID da Pessoa Sobrevivente (Destino / Manterá a identidade) *
                </label>
                <input
                  type="text"
                  required
                  value={mergeTargetId}
                  onChange={(e) => setMergeTargetId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: 13
                  }}
                  placeholder="ID da Person que sobreviverá..."
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Motivo da Fusão (Audit Trail) *
                </label>
                <input
                  type="text"
                  required
                  value={mergeReason}
                  onChange={(e) => setMergeReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: 13
                  }}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                  Sobreposição Opcional de Dados Canônicos no Destino:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  <input
                    type="text"
                    value={overrideName}
                    onChange={(e) => setOverrideName(e.target.value)}
                    placeholder="Novo Nome Canônico"
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: 12
                    }}
                  />
                  <input
                    type="email"
                    value={overrideEmail}
                    onChange={(e) => setOverrideEmail(e.target.value)}
                    placeholder="Novo E-mail Oficial"
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: 12
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={processingId === 'merge'}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {processingId === 'merge' ? 'Mesclando...' : 'Confirmar Fusão Atômica'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
