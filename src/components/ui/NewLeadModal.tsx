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


        </div>
      </div>
    </div>
  );
}
