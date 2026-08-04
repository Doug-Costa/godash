'use client';

import { useState, useEffect } from 'react';

interface CampaignMonitorDashboardProps {
  onBackToJourneys?: () => void;
}

export default function CampaignMonitorDashboard({ onBackToJourneys }: CampaignMonitorDashboardProps) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns/metrics');
      if (res.ok) {
        const json = await res.json();
        setCampaigns(json.data || []);
      }
    } catch (err) {
      console.error('Error loading campaign metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const openCampaignDetail = async (id: string) => {
    setSelectedCampaignId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/campaigns/metrics?journeyId=${id}`);
      if (res.ok) {
        const json = await res.json();
        setDetailData(json.data || null);
      }
    } catch (err) {
      console.error('Error fetching campaign detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Aggregated KPIs
  const totalSent = campaigns.reduce((acc, c) => acc + (c.sentEmails || 0), 0);
  const totalFailed = campaigns.reduce((acc, c) => acc + (c.failedEmails || 0), 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + (c.openedEmails || 0), 0);
  const totalAll = campaigns.reduce((acc, c) => acc + (c.totalEmails || 0), 0);
  const successRate = totalAll > 0 ? Math.round((totalSent / totalAll) * 100) : 100;
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fadeUp">
      {/* Top Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            🚀 Dashboard de Campanhas & Disparos
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Monitore e gerencie o progresso dos disparos em lote da VPS com controle de cadência ativada.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={fetchCampaigns}
            className="btn-action btn-action-outline"
            style={{ fontSize: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            🔄 Atualizar Data
          </button>
          {onBackToJourneys && (
            <button
              onClick={onBackToJourneys}
              className="btn-action btn-action-purple"
              style={{ fontSize: 12, padding: '8px 16px' }}
            >
              ⬅️ Voltar para Reguas / Fluxos
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div className="card" style={{ background: 'var(--surface-raised)', padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Envia dos</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>{totalSent.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>de {totalAll.toLocaleString()} agendados</div>
        </div>

        <div className="card" style={{ background: 'var(--surface-raised)', padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Taxa de Sucesso</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>{successRate}%</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{totalFailed} disparos com falha</div>
        </div>

        <div className="card" style={{ background: 'var(--surface-raised)', padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Taxa de Abertura</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>{openRate}%</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{totalOpened} aberturas confirmadas</div>
        </div>

        <div className="card" style={{ background: 'var(--surface-raised)', padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Erros & Rejeições</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: totalFailed > 0 ? 'var(--red)' : 'var(--text-muted)', marginTop: 4 }}>
            {totalFailed}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Proteção Anti-Blacklist Ativa</div>
        </div>
      </div>

      {/* Main Campaign Monitor Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Disparos Registrados
            </h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clique em qualquer linha da campanha para ver o progresso dos estágios e logs por lead.</span>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando métricas de campanha...</div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✉️</div>
              <strong>Nenhuma campanha de disparos registrada no momento.</strong>
              <div style={{ fontSize: 12, marginTop: 4 }}>Crie um novo fluxo na Central de Jornadas para iniciar disparos inteligentes.</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome da Campanha</th>
                  <th>Modo & Cadência</th>
                  <th>Status</th>
                  <th>Progresso</th>
                  <th>Sucesso / Erro</th>
                  <th>Aberturas</th>
                  <th>Data Criação</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const sent = c.sentEmails || 0;
                  const total = c.totalEmails || (c._count?.leads || 1);
                  const progressPct = Math.min(100, Math.round((sent / Math.max(1, total)) * 100));
                  const modeLabel = c.sendingMode === 'RANDOM' ? '🎲 Aleatório' : c.sendingMode === 'FIXED' ? '⏱️ Fixa' : '⚡ Imediata';
                  const delayInfo = c.sendingMode === 'RANDOM' ? `${c.minDelay}ms - ${c.maxDelay}ms` : c.sendingMode === 'FIXED' ? `${c.minDelay}ms` : 'Sem delay';

                  return (
                    <tr
                      key={c.id}
                      onClick={() => openCampaignDetail(c.id)}
                      style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                      className="table-row-hover"
                    >
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ color: 'var(--text-primary)', fontSize: 13 }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', gap: 6, marginTop: 2 }}>
                          {c.automations?.map((auto: any, idx: number) => (
                            <span key={idx} className="badge badge-neu" style={{ fontSize: 9 }}>
                              {auto.channel === 'WHATSAPP' ? '💬' : '📧'} Passo {idx + 1}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>{modeLabel}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{delayInfo}</div>
                      </td>
                      <td>
                        <span className={`badge ${c.status === 'ACTIVE' ? 'badge-cyan' : c.status === 'COMPLETED' ? 'badge-green' : 'badge-purple'}`} style={{ fontSize: 10 }}>
                          {c.status === 'ACTIVE' ? '🟢 Em Disparo' : c.status === 'COMPLETED' ? '✅ Concluído' : c.status}
                        </span>
                      </td>
                      <td style={{ width: 180 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>{sent} / {total}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{progressPct}%</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'var(--surface-raised)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.4s ease' }} />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
                          <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓ {sent}</span>
                          {c.failedEmails > 0 && (
                            <span style={{ color: 'var(--red)', fontWeight: 700 }}>✗ {c.failedEmails}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8' }}>
                        👁️ {c.openedEmails || 0}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Campaign Detailed Drawer / Modal */}
      {selectedCampaignId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card animate-scaleUp" style={{ width: '100%', maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', padding: 24, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div>
                <span className="badge badge-purple" style={{ fontSize: 10, marginBottom: 4 }}>Detalhamento em Tempo Real</span>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700 }}>
                  {detailData?.journey?.name || 'Carregando Campanha...'}
                </h3>
              </div>
              <button
                onClick={() => { setSelectedCampaignId(null); setDetailData(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {loadingDetail ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Buscando logs de disparo e estágios...</div>
            ) : detailData ? (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Cadence Specs */}
                <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <span className="label-sm" style={{ fontSize: 10 }}>Modo de Cadência:</span>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>
                      {detailData.journey.sendingMode === 'RANDOM' ? '🎲 Aleatório (Delay Variável)' : detailData.journey.sendingMode === 'FIXED' ? '⏱️ Fixa' : '⚡ Imediato'}
                    </div>
                  </div>
                  <div>
                    <span className="label-sm" style={{ fontSize: 10 }}>Intervalo de Disparo:</span>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                      {detailData.journey.minDelay}ms até {detailData.journey.maxDelay}ms
                    </div>
                  </div>
                  <div>
                    <span className="label-sm" style={{ fontSize: 10 }}>Proteção Anti-Blacklist:</span>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginTop: 2 }}>
                      🟢 Ativa & Monitorada
                    </div>
                  </div>
                </div>

                {/* Steps / Automation Stages */}
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                    📌 Estágios Configurados no Fluxo
                  </h4>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {detailData.journey.automations?.map((step: any, i: number) => (
                      <div key={step.id} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>PASSO {i + 1}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                          {step.channel === 'WHATSAPP' ? '💬 WhatsApp' : '📧 E-mail'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                          Delay de Execução: <strong>{step.delayDays || step.delay || 0} dia(s)</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Granular Recipient Logs */}
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                    📜 Logs de Destinatários & Entregas
                  </h4>
                  {detailData.recipientLogs?.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-raised)', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                      Nenhum disparo individual registrado nesta jornada ainda.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                      <table style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th>Destinatário</th>
                            <th>Status</th>
                            <th>Abertura</th>
                            <th>Data Envio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.recipientLogs.map((log: any) => (
                            <tr key={log.id}>
                              <td style={{ fontSize: 12, fontWeight: 600 }}>{log.email}</td>
                              <td>
                                <span className={`badge ${log.status === 'SENT' ? 'badge-green' : log.status === 'FAILED' ? 'badge-red' : 'badge-neu'}`} style={{ fontSize: 9 }}>
                                  {log.status === 'SENT' ? '✓ Enviado' : log.status === 'FAILED' ? '✗ Falha' : log.status}
                                </span>
                              </td>
                              <td style={{ fontSize: 11 }}>
                                {log.opened ? (
                                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>🟢 Sim</span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>⚪ Não</span>
                                )}
                              </td>
                              <td style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {log.sentAt ? new Date(log.sentAt).toLocaleString('pt-BR') : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Modal Footer */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setSelectedCampaignId(null); setDetailData(null); }}
                className="btn-action btn-action-outline"
                style={{ fontSize: 12, padding: '6px 16px' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
