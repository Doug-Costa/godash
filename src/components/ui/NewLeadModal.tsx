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

  // Conflict State
  const [conflictData, setConflictData] = useState<{ personName: string; conflicts: any[] } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  if (!isOpen) return null;

  const performImport = async () => {
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
        setConflictData(null);
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    
    try {
      const checkRes = await fetch('/api/leads/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualData.name,
          email: manualData.email,
          phone: manualData.phone
        })
      });

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists && checkData.conflicts && checkData.conflicts.length > 0) {
          setConflictData({
            personName: checkData.personName,
            conflicts: checkData.conflicts
          });
          setIsChecking(false);
          return; // Stop here, show conflict UI
        }
      }
      
      // If no conflict or error in check, proceed to import
      await performImport();
    } catch (err) {
      console.error(err);
      alert('Erro ao verificar conflitos. Prosseguindo com inserção...');
      await performImport();
    } finally {
      setIsChecking(false);
    }
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
          {conflictData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(234, 179, 8, 0.1)', padding: 24, borderRadius: 12, border: '1px solid #EAB308' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#CA8A04' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Conflito Detectado!</h4>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>
                O sistema já encontrou o contato <strong>{conflictData.personName}</strong>. 
                Ele possui as seguintes oportunidades em aberto:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                {conflictData.conflicts.map((c, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    Funil <strong>{c.pipelineName}</strong> (Campanha: {c.journeyName}) - Em atendimento por <strong>{c.assigneeName}</strong>
                  </li>
                ))}
              </ul>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                Você tem certeza que deseja criar uma nova oportunidade paralela para ele?
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button 
                  onClick={() => setConflictData(null)}
                  style={{ flex: 1, padding: '10px 16px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar e Voltar
                </button>
                <button 
                  onClick={performImport}
                  disabled={isUploading}
                  style={{ flex: 1, padding: '10px 16px', borderRadius: 8, background: '#CA8A04', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isUploading ? 'Inserindo...' : 'Forçar Inserção Paralela'}
                </button>
              </div>
            </div>
          ) : (
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
                  disabled={isChecking || isUploading}
                  className="btn-action btn-action-purple"
                  style={{ padding: '10px 24px', borderRadius: 8, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 600 }}
                >
                  {isChecking ? 'Verificando...' : isUploading ? 'Adicionando...' : 'Adicionar Lead'}
                </button>
              </div>
            </form>
          )}


        </div>
      </div>
    </div>
  );
}
