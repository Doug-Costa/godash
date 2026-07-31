'use client';

import React, { useState } from 'react';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: () => void;
  pipelines: { id: string; name: string }[];
}

export function NewLeadModal({ isOpen, onClose, onLeadAdded, pipelines }: NewLeadModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'csv'>('manual');
  
  // Manual Form State
  const [manualData, setManualData] = useState({
    name: '',
    email: '',
    phone: '',
    pipelineId: pipelines.length > 0 ? pipelines[0].id : '',
    source: 'MANUAL'
  });

  // CSV Form State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPipelineId, setCsvPipelineId] = useState(pipelines.length > 0 ? pipelines[0].id : '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{success: number; failed: number; total: number} | null>(null);
  
  if (!isOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'manual',
          data: manualData
        })
      });
      
      if (res.ok) {
        onLeadAdded();
        onClose();
        setManualData({ ...manualData, name: '', email: '', phone: '' });
      } else {
        alert('Erro ao adicionar lead');
      }
    } catch (err) {
      console.error(err);
      alert('Erro na comunicação com o servidor');
    } finally {
      setIsUploading(false);
    }
  };

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const results: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values: string[] = [];
      let currentVal = '';
      let inQuotes = false;
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (header) {
          obj[header] = values[index] || '';
        }
      });
      results.push(obj);
    }
    return results;
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setIsUploading(true);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const parsedData = parseCSV(text);

      try {
        const res = await fetch('/api/leads/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'csv',
            pipelineId: csvPipelineId,
            source: 'CSV',
            rows: parsedData
          })
        });

        const json = await res.json();
        if (res.ok) {
          setUploadResult({
            success: json.successCount || 0,
            failed: json.failedCount || 0,
            total: parsedData.length
          });
          onLeadAdded();
        } else {
          alert('Erro ao importar CSV: ' + json.error);
        }
      } catch (err) {
        console.error(err);
        alert('Erro na comunicação com o servidor durante a importação.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(csvFile);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card animate-fadeUp" style={{ 
        width: '100%', maxWidth: '650px', background: 'var(--surface)', padding: 24, 
        display: 'flex', flexDirection: 'column', maxHeight: '90vh', borderRadius: 16, 
        border: '1px solid var(--border)', boxShadow: 'var(--shadow)', boxSizing: 'border-box'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Adicionar Novo Lead
          </h3>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          <button 
            onClick={() => setActiveTab('manual')}
            style={{
              padding: '12px 24px', background: 'transparent', border: 'none', 
              borderBottom: activeTab === 'manual' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === 'manual' ? 'var(--accent)' : 'var(--text-secondary)', 
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Entrada Manual
          </button>
          <button 
            onClick={() => setActiveTab('csv')}
            style={{
              padding: '12px 24px', background: 'transparent', border: 'none', 
              borderBottom: activeTab === 'csv' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === 'csv' ? 'var(--accent)' : 'var(--text-secondary)', 
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Importação via CSV
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12 }}>Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={manualData.name}
                  onChange={e => setManualData({...manualData, name: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12 }}>Email</label>
                  <input 
                    type="email" 
                    value={manualData.email}
                    onChange={e => setManualData({...manualData, email: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    placeholder="joao@exemplo.com"
                  />
                </div>
                <div>
                  <label className="label-sm" style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12 }}>Telefone (WhatsApp)</label>
                  <input 
                    type="text" 
                    required
                    value={manualData.phone}
                    onChange={e => setManualData({...manualData, phone: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12 }}>Funil de Destino</label>
                <select 
                  value={manualData.pipelineId}
                  onChange={e => setManualData({...manualData, pipelineId: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
                >
                  {pipelines.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="btn-action btn-action-purple"
                  style={{ padding: '10px 24px', borderRadius: 8, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 600 }}
                >
                  {isUploading ? 'Adicionando...' : 'Adicionar Lead'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'csv' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                  Instruções do CSV
                </h4>
                <p style={{ margin: '0 0 12px 0', fontSize: 12, color: 'var(--text-secondary)' }}>O arquivo CSV deve conter um cabeçalho na primeira linha. As colunas reconhecidas são:</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, color: 'var(--text-primary)', padding: '4px 8px' }}>nome</span>
                  <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, color: 'var(--text-primary)', padding: '4px 8px' }}>email</span>
                  <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, color: 'var(--text-primary)', padding: '4px 8px' }}>telefone</span>
                  <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, color: 'var(--text-primary)', padding: '4px 8px' }}>stage</span>
                </div>
              </div>

              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12 }}>Funil de Destino</label>
                <select 
                  value={csvPipelineId}
                  onChange={e => setCsvPipelineId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
                >
                  {pipelines.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{
                border: '2px dashed var(--border)', borderRadius: 12, padding: '32px 16px', textAlign: 'center',
                background: 'var(--surface-raised)', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {csvFile ? csvFile.name : 'Arraste seu arquivo CSV ou clique para selecionar'}
                </p>
                <label className="btn-action btn-action-outline" style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontWeight: 600, fontSize: 12 }}>
                  Selecionar Arquivo
                  <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => setCsvFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              {uploadResult && (
                <div style={{
                  padding: 16, borderRadius: 8, border: '1px solid',
                  background: uploadResult.failed === 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                  borderColor: uploadResult.failed === 0 ? '#4ADE80' : '#F87171',
                  color: uploadResult.failed === 0 ? '#4ADE80' : '#F87171'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {uploadResult.failed === 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    )}
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Importação Concluída</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
                        {uploadResult.success} leads importados com sucesso. {uploadResult.failed} falhas. Total processado: {uploadResult.total}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <button 
                  onClick={handleCsvUpload}
                  disabled={!csvFile || isUploading}
                  className="btn-action btn-action-purple"
                  style={{ padding: '10px 24px', borderRadius: 8, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 600 }}
                >
                  {isUploading ? 'Importando...' : 'Iniciar Importação'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
