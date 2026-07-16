'use client';

import { useState, useEffect } from 'react';

interface AutomatedCampaignAnalyticsProps {
  campaignId: string;
  onBack?: () => void;
}

export default function AutomatedCampaignAnalytics({ campaignId, onBack }: AutomatedCampaignAnalyticsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/campaigns/automated-analytics?campaignId=${campaignId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        } else {
          const json = await res.json();
          setError(json.error || 'Erro ao carregar analytics.');
        }
      } catch (err) {
        console.error('Error fetching automated campaign analytics:', err);
        setError('Erro de conexão ao carregar analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [campaignId]);

  if (loading) {
    return <div className="skeleton" style={{ height: 300, width: '100%' }}></div>;
  }

  if (error || !data) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--red)', fontWeight: 600 }}>{error || 'Não foi possível carregar os dados.'}</p>
        <button onClick={onBack} className="btn-action btn-action-outline" style={{ marginTop: 12 }}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: 18, borderRadius: 12, border: '1px solid var(--border)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <h3 style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>
              Raio-X: {data.campaignName}
            </h3>
            <span className="badge badge-cyan" style={{ fontSize: 9 }}>{data.status}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Monitoramento de desempenho automático em tempo real. Total de leads vinculados: <strong>{data.totalLeads}</strong>.
          </p>
        </div>
        {onBack && (
          <button onClick={onBack} className="btn-action btn-action-outline" style={{ fontSize: 12, padding: '8px 16px' }}>
            ◀️ Voltar
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {/* Disparados */}
        <div className="stat-card" style={{ padding: 18, background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div className="label-sm" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>📤 Disparos Efetuados</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', margin: '8px 0' }}>
            {data.metrics.sent}
          </div>
          <div className="label-sm" style={{ color: 'var(--text-faint)' }}>Total executado pelo motor</div>
        </div>

        {/* Entregues */}
        <div className="stat-card" style={{ padding: 18, background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div className="label-sm" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>✅ Entregues com Sucesso</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent)', margin: '8px 0' }}>
            {data.metrics.delivered}
          </div>
          <div className="label-sm" style={{ color: 'var(--text-faint)' }}>Taxa de entrega: {data.metrics.deliveryRate.toFixed(1)}%</div>
        </div>

        {/* Taxa de Abertura */}
        <div className="stat-card" style={{ padding: 18, background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div className="label-sm" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>👁️ Taxa de Abertura / Leitura</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--cyan)', margin: '8px 0' }}>
            {data.metrics.read}
          </div>
          <div className="label-sm" style={{ color: 'var(--text-faint)' }}>Taxa de engajamento: {data.metrics.readRate.toFixed(1)}%</div>
        </div>

        {/* Leads Qualificados */}
        <div className="stat-card" style={{ padding: 18, background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div className="label-sm" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>🔥 Leads Qualificados</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--orange)', margin: '8px 0' }}>
            {data.metrics.qualifiedLeads}
          </div>
          <div className="label-sm" style={{ color: 'var(--text-faint)' }}>Leads com score &ge; 50</div>
        </div>
      </div>

      {/* Funnel of Engagement & Failed Logs Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Engagement Funnel Graph */}
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16, marginTop: 0 }}>
            📉 Funil de Engajamento por Etapa
          </h4>
          {data.funnelSteps.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>Nenhum passo executado ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.funnelSteps.map((step: any, idx: number) => {
                const widthPct = data.funnelSteps[0]?.sent > 0 ? (step.sent / data.funnelSteps[0].sent) * 100 : 100;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-primary)' }}>{step.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {step.sent} envios &bull; {step.read} aberturas
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 16, background: 'var(--surface-raised)', borderRadius: 4, overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${widthPct}%`, height: '100%', 
                          background: 'linear-gradient(90deg, var(--accent), var(--cyan))', 
                          borderRadius: 4, transition: 'width 0.4s ease' 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Failed Logs log table */}
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16, marginTop: 0 }}>
            🚨 Log de Falhas de Disparo
          </h4>
          {data.failedLogs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>
              🎉 Nenhuma falha de disparo registrada na campanha!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '6px 8px' }}>Lead</th>
                    <th style={{ padding: '6px 8px' }}>Canal</th>
                    <th style={{ padding: '6px 8px' }}>Mensagem de Erro</th>
                    <th style={{ padding: '6px 8px' }}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.failedLogs.map((log: any) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 8px', fontWeight: 600, color: 'var(--text-primary)' }}>{log.leadName}</td>
                      <td style={{ padding: '8px 8px' }}>
                        <span className="badge" style={{ fontSize: 9, background: log.channel === 'WHATSAPP' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(96, 165, 250, 0.15)', color: log.channel === 'WHATSAPP' ? '#4ADE80' : '#60A5FA' }}>
                          {log.channel}
                        </span>
                      </td>
                      <td style={{ padding: '8px 8px', color: 'var(--red)' }}>{log.errorMessage}</td>
                      <td style={{ padding: '8px 8px', color: 'var(--text-faint)', fontSize: 11 }}>
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
