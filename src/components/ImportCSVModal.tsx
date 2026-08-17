import React, { useState, useEffect } from 'react';
import { PreflightSummary } from '@/lib/services/ImportPreflightService';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportCSVModal({ isOpen, onClose, onSuccess }: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<PreflightSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/products')
        .then(res => res.json())
        .then(data => setProducts(data))
        .catch(console.error);
    } else {
      // Reset state when closing
      setFile(null);
      setSummary(null);
      setError(null);
      setSuccessMsg(null);
      setLoading(false);
      setCommitting(false);
      setShowManual(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSummary(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/leads/import/preflight', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAliasCreation = async (rawValue: string, productId: string) => {
    try {
      const res = await fetch('/api/leads/import/alias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawValue, productId })
      });
      if (!res.ok) throw new Error('Falha ao criar alias');
      
      await handleUpload(); // Re-run preflight
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCommit = async () => {
    if (!summary || !file) return;
    setCommitting(true);
    setError(null);

    try {
      const res = await fetch('/api/leads/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchInfo: {
            fileName: file.name,
            schemaVersion: 'v4-canonical'
          },
          rows: summary.results
        })
      });

      if (!res.ok) throw new Error(await res.text());

      const result = await res.json();
      setSuccessMsg(`Importação concluída! Sucesso: ${result.successRows}, Erros: ${result.errorRows}`);
      setSummary(null);
      setFile(null);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card animate-fadeUp" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', background: 'var(--surface)', padding: 32, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              📥 Importar Leads (CSV)
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9rem' }}>
              Motor de ingestão com resolução canônica de identidade e catálogo.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}>
            &times;
          </button>
        </div>

        {/* Templates Download */}
        <div style={{ display: 'flex', gap: '16px', background: 'var(--surface-raised)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <h5 style={{ color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '0.95rem' }}>Baixe nosso CSV Demo (Padrão)</h5>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Utilize nossa planilha formatada para evitar erros.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setShowManual(!showManual)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              📖 Dicionário de Dados {showManual ? '▲' : '▼'}
            </button>
            <a href="/api/leads/import/template?type=canonical" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              📄 Template Completo
            </a>
            <a href="/api/leads/import/template?type=marketing" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--accent)', color: 'var(--accent)', background: 'var(--accent-glow)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              📊 Template Mkt
            </a>
          </div>
        </div>

        {showManual && (
          <div className="animate-fadeDown" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <h4 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '1rem' }}>Dicionário de Preenchimento</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>nome (obrigatório)</strong>
                <p style={{ margin: '4px 0 0 0' }}>Nome completo do lead. O sistema tentará unir (merge) casos idênticos.</p>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>email / phone</strong>
                <p style={{ margin: '4px 0 0 0' }}>Para telefone, utilize o código de área. É crucial para identificar leads repetidos.</p>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>external_id</strong>
                <p style={{ margin: '4px 0 0 0' }}>ID do contato no seu sistema legado, hotmart, ou ERP (ex: 492011). Essencial para migrações.</p>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>product</strong>
                <p style={{ margin: '4px 0 0 0' }}>Nome ou ID do produto vendido. O sistema tentará associar automaticamente aos seus produtos cadastrados.</p>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>price / currency</strong>
                <p style={{ margin: '4px 0 0 0' }}>Preço pago e a moeda (BRL, USD, EUR). Se não preencher "currency", assumimos BRL.</p>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>ended_at</strong>
                <p style={{ margin: '4px 0 0 0' }}>Data de fechamento ou fim do contrato, usado no cálculo de Lifetime Value (LTV).</p>
              </div>
            </div>
          </div>
        )}

        {error && <div style={{ background: 'var(--red-glow)', color: 'var(--red)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid rgba(220, 38, 38, 0.2)' }}>⚠️ {error}</div>}
        {successMsg && <div style={{ background: 'var(--green-glow)', color: 'var(--green)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid rgba(22, 163, 74, 0.2)' }}>✅ {successMsg}</div>}

        {/* Upload Section */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '12px' }}>1. Enviar Arquivo</h4>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <input 
              type="file" 
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{
                flex: 1, padding: '10px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)'
              }}
            />
            <button 
              onClick={handleUpload}
              disabled={!file || loading}
              className="btn-action btn-action-purple"
              style={{ padding: '12px 24px' }}
            >
              {loading ? 'Analisando...' : 'Fazer Pre-flight'}
            </button>
          </div>
        </div>

        {/* Preflight Summary */}
        {summary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: 0 }}>2. Resultado do Pre-flight</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div style={{ background: 'var(--green-glow)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(22, 163, 74, 0.2)', textAlign: 'center' }}>
                <div style={{ color: 'var(--green)', fontSize: '0.8rem', fontWeight: 700 }}>Prontos (READY)</div>
                <div style={{ color: 'var(--green)', fontSize: '1.8rem', fontWeight: 800 }}>{summary.readyRows}</div>
              </div>
              <div style={{ background: 'var(--yellow-glow)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(202, 138, 4, 0.2)', textAlign: 'center' }}>
                <div style={{ color: 'var(--yellow)', fontSize: '0.8rem', fontWeight: 700 }}>Avisos (WARNING)</div>
                <div style={{ color: 'var(--yellow)', fontSize: '1.8rem', fontWeight: 800 }}>{summary.warningRows}</div>
              </div>
              <div style={{ background: 'var(--red-glow)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(220, 38, 38, 0.2)', textAlign: 'center' }}>
                <div style={{ color: 'var(--red)', fontSize: '0.8rem', fontWeight: 700 }}>Erros (ERROR)</div>
                <div style={{ color: 'var(--red)', fontSize: '1.8rem', fontWeight: 800 }}>{summary.errorRows}</div>
              </div>
              <div style={{ background: 'var(--accent-glow)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'center' }}>
                <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700 }}>Revisão (HITL)</div>
                <div style={{ color: 'var(--accent)', fontSize: '1.8rem', fontWeight: 800 }}>{summary.reviewRows}</div>
              </div>
            </div>

            {summary.reviewRows > 0 && (
              <div style={{ background: 'var(--surface-raised)', padding: '20px', borderRadius: '12px', border: '1px solid var(--accent)' }}>
                <h5 style={{ color: 'var(--accent)', margin: '0 0 8px 0', fontSize: '1rem' }}>Ação Necessária: Produtos Desconhecidos</h5>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  O catálogo não reconheceu as nomenclaturas abaixo. Mapeie para um produto oficial para prosseguir.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {summary.results.filter(r => r.status === 'REVIEW_REQUIRED').map((row) => (
                    <div key={row.index} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--background)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: 'var(--surface)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                          {row.parsedData?.product_name || row.parsedData?.product_id}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <select 
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          onChange={(e) => handleAliasCreation(row.parsedData?.product_name || row.parsedData?.product_id || '', e.target.value)}
                          defaultValue=""
                        >
                          <option value="" disabled>Selecione o produto oficial...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button 
                onClick={handleCommit}
                disabled={committing || summary.reviewRows > 0}
                style={{
                  background: (committing || summary.reviewRows > 0) ? 'var(--surface-raised)' : 'var(--green)',
                  color: (committing || summary.reviewRows > 0) ? 'var(--text-muted)' : '#fff',
                  padding: '12px 24px', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: (committing || summary.reviewRows > 0) ? 'not-allowed' : 'pointer'
                }}
              >
                {committing ? 'Importando...' : `Finalizar Importação (${summary.readyRows + summary.warningRows} leads)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
