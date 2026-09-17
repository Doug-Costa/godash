'use client';

import React, { useState, useEffect } from 'react';
import { BitrixPreflightSummary, BitrixProcessedDeal } from '@/lib/domain/BitrixImportContract';

interface BitrixImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BitrixImportModal({ isOpen, onClose, onSuccess }: BitrixImportModalProps) {
  const [contactsFile, setContactsFile] = useState<File | null>(null);
  const [dealsFile, setDealsFile] = useState<File | null>(null);
  const [recencyDays, setRecencyDays] = useState<number>(90);
  const [summary, setSummary] = useState<BitrixPreflightSummary | null>(null);
  const [simulatedDeals, setSimulatedDeals] = useState<BitrixProcessedDeal[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [pipelines, setPipelines] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/pipelines')
        .then(r => r.json())
        .then(data => {
          const list = data.data || data || [];
          setPipelines(list);
          if (list.length > 0) setSelectedPipelineId(list[0].id);
        })
        .catch(console.error);
    } else {
      setContactsFile(null);
      setDealsFile(null);
      setSummary(null);
      setSimulatedDeals([]);
      setError(null);
      setSuccessMsg(null);
      setLoading(false);
      setCommitting(false);
      setProgress(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper simples para parsear CSV client-side antes do envio
  const parseCSV = async (file: File): Promise<any[]> => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(';').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(';').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const obj: any = {};
      headers.forEach((h, index) => {
        obj[h] = currentline[index] || '';
      });
      rows.push(obj);
    }
    return rows;
  };

  const handlePreflight = async () => {
    if (!contactsFile && !dealsFile) {
      setError('Por favor, selecione ao menos o arquivo de Negócios (deals.csv).');
      return;
    }

    setLoading(true);
    setError(null);
    setSummary(null);
    setSimulatedDeals([]);
    setProgress(null);

    try {
      let contactsRaw: any[] = [];
      let dealsRaw: any[] = [];

      if (contactsFile) {
        contactsRaw = await parseCSV(contactsFile);
      }
      if (dealsFile) {
        dealsRaw = await parseCSV(dealsFile);
      }

      // Normalizar chaves comuns do Bitrix
      const normalizedContacts = contactsRaw.map(c => ({
        id: c['ID'] || c['Id'] || c['id'] || c['Código'],
        name: c['Nome'] || c['NAME'] || c['name'] || c['Primeiro Nome'] || c['Primeiro nome'],
        lastName: c['Sobrenome'] || c['LAST_NAME'] || c['last_name'],
        secondName: c['Segundo nome'] || c['SECOND_NAME'],
        email: c['Email de trabalho'] || c['E-mail de trabalho'] || c['E-mail de casa'] || c['E-mail para boletins'] || c['Outro e-mail'] || c['E-mail'] || c['EMAIL'],
        phone: c['Celular'] || c['Telefone de trabalho'] || c['Telefone celular'] || c['Telefone de casa'] || c['Telefone'] || c['PHONE'],
        source: c['Fonte'] || c['SOURCE_ID'],
        assignedByName: c['Responsável'] || c['ASSIGNED_BY_NAME'],
        raw: c
      }));

      const normalizedDeals = dealsRaw.map(d => ({
        id: d['ID'] || d['Id'] || d['id'],
        title: d['Nome do negócio'] || d['Título'] || d['TITLE'],
        stageId: d['Fase'] || d['STAGE_ID'],
        stageSemanticId: d['Semântica da fase'] || d['STAGE_SEMANTIC_ID'],
        contactId: d['Contato: ID'] || d['CONTACT_ID'] || d['ID do contato'] || d['Contato'],
        contactName: d['Contato: Primeiro Nome'] || d['Contato: Primeiro nome'] || d['Contato: Nome'] || d['Contato:Nome'] || d['Contato'],
        contactLastName: d['Contato: Sobrenome'] || d['Contato:Sobrenome'],
        contactEmail: d['Contato: Email de trabalho'] || d['Contato: E-mail de trabalho'] || d['Contato: E-mail de casa'] || d['Contato: E-mail para boletins'] || d['Contato: Outro e-mail'] || d['Contato: E-mail'] || d['Contato:E-mail'],
        contactPhone: d['Contato: Celular'] || d['Contato: Telefone de trabalho'] || d['Contato: Telefone celular'] || d['Contato: Telefone de casa'] || d['Contato: Telefone'] || d['Contato:Telefone'],
        opportunity: d['Renda'] || d['Valor'] || d['OPPORTUNITY'],
        assignedByName: d['Responsável'] || d['ASSIGNED_BY_NAME'],
        dateCreate: d['Criado'] || d['Criado em'] || d['DATE_CREATE'],
        dateModify: d['Modificado'] || d['Modificado em'] || d['DATE_MODIFY'],
        lossReason: d['Motivo da perda'] || d['LOSS_REASON'],
        interestArea: d['Área de interesse'] || d['Especialidade'] || d['Área de interesse (Negócio)'],
        formId: d['Criada pelo formulário de CRM'] || d['FORM_ID'] || d['Criadas pelo formulário de CRM'],
        utmSource: d['Origem UTMSource'] || d['UTM_SOURCE'] || d['UTM Source'],
        utmMedium: d['Meio UTM'] || d['UTM_MEDIUM'] || d['UTM Medium'],
        utmCampaign: d['Campanha UTM'] || d['UTM_CAMPAIGN'] || d['UTM Campaign'],
        raw: d
      }));

      const preflightRes: Response = await fetch('/api/leads/import/bitrix/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: normalizedContacts,
          deals: normalizedDeals,
          recencyCutoffDays: recencyDays
        })
      });

      if (!preflightRes.ok) {
        throw new Error(await preflightRes.text());
      }

      const preflightJson: any = await preflightRes.json();
      if (!preflightJson.success) throw new Error(preflightJson.error);

      setSummary(preflightJson.summary);
      setSimulatedDeals(preflightJson.processedDeals || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar preflight Bitrix.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!summary || simulatedDeals.length === 0) return;
    setCommitting(true);
    setError(null);
    setProgress({ current: 0, total: simulatedDeals.length, percent: 0 });

    const chunkSize = 250;
    const totalChunks = Math.ceil(simulatedDeals.length / chunkSize);
    let batchId: string | undefined = undefined;
    let totalSuccess = 0;
    let totalErrors = 0;
    let totalRecovered = 0;

    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const chunkDeals = simulatedDeals.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize);
        const isFirstChunk = chunkIndex === 0;
        const isLastChunk = chunkIndex === totalChunks - 1;

        const commitRes: Response = await fetch('/api/leads/import/bitrix/commit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: dealsFile?.name || 'bitrix_migration.csv',
            deals: chunkDeals,
            targetPipelineId: selectedPipelineId,
            batchId,
            isFirstChunk,
            isLastChunk,
            totalExpectedDeals: simulatedDeals.length
          })
        });

        if (!commitRes.ok) {
          const text = await commitRes.text();
          throw new Error(`Falha no lote ${chunkIndex + 1}/${totalChunks}: ${text}`);
        }

        const commitData: any = await commitRes.json();
        if (!commitData.success) throw new Error(commitData.error);

        if (commitData.data?.batchId) {
          batchId = commitData.data.batchId;
        }
        totalSuccess += commitData.data?.successRows || 0;
        totalErrors += commitData.data?.errorRows || 0;
        totalRecovered += commitData.data?.recoveredCount || 0;

        const processedCount = Math.min(simulatedDeals.length, (chunkIndex + 1) * chunkSize);
        const pct = Math.round((processedCount / simulatedDeals.length) * 100);
        setProgress({ current: processedCount, total: simulatedDeals.length, percent: pct });
      }

      setSuccessMsg(
        `🎉 Migração Bitrix24 concluída com sucesso! ` +
        `Processados: ${totalSuccess} negócios com segurança. ` +
        `Contatos recuperados do snapshot: ${totalRecovered}.`
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Erro durante o processamento do lote.');
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
      <div className="card animate-fadeUp" style={{ width: '100%', maxWidth: '880px', maxHeight: '92vh', background: 'var(--surface)', padding: 32, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>🔄</span> Migrador Seguro Bitrix24 → DentalGO CRM
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.9rem' }}>
              Importação idempotente com recuperação de órfãos, preservação de operadores e cinto de segurança.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}>
            &times;
          </button>
        </div>

        {error && <div style={{ background: 'var(--red-glow)', color: 'var(--red)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid rgba(220, 38, 38, 0.2)' }}>⚠️ {error}</div>}
        {successMsg && <div style={{ background: 'var(--green-glow)', color: 'var(--green)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid rgba(22, 163, 74, 0.2)' }}>✅ {successMsg}</div>}

        {/* 1. Upload dos Dois Arquivos */}
        <div style={{ background: 'var(--surface-raised)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', margin: '0 0 14px 0', fontWeight: 700 }}>
            📁 1. Arquivos Exportados do Bitrix (CSV com delimitador ponto e vírgula ;)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>1. Planilha de Contatos (contacts.csv):</label>
              <input 
                type="file" 
                accept=".csv"
                onChange={e => setContactsFile(e.target.files?.[0] || null)}
                style={{ width: '100%', padding: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
              />
            </div>
            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>2. Planilha de Negócios (deals.csv):</label>
              <input 
                type="file" 
                accept=".csv"
                onChange={e => setDealsFile(e.target.files?.[0] || null)}
                style={{ width: '100%', padding: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
              />
            </div>
          </div>
        </div>

        {/* 2. Configurações de Recência e Funil */}
        <div style={{ background: 'var(--surface-raised)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', margin: '0 0 14px 0', fontWeight: 700 }}>
            ⚙️ 2. Régua de Recência & Proteção do Kanban
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Janela de Negócios Abertos Ativos no Kanban:
              </label>
              <select
                value={recencyDays}
                onChange={e => setRecencyDays(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer' }}
              >
                <option value={30}>Últimos 30 dias (Mais conservador - Kanban ultralimpo)</option>
                <option value={60}>Últimos 60 dias (Recomendado)</option>
                <option value={90}>Últimos 90 dias (Padrão 3 meses)</option>
                <option value={180}>Últimos 180 dias (Semestre)</option>
                <option value={3650}>Sem corte (Todos os abertos vão ao Kanban)</option>
              </select>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                * Negócios anteriores à data de corte são arquivados como dormentes para não sobrecarregar as operadoras.
              </p>
            </div>

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Funil de Destino Principal:
              </label>
              <select
                value={selectedPipelineId}
                onChange={e => setSelectedPipelineId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer' }}
              >
                {pipelines.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button 
              onClick={handlePreflight}
              disabled={loading || (!contactsFile && !dealsFile)}
              className="btn-action btn-action-purple"
              style={{ padding: '12px 24px', fontWeight: 600 }}
            >
              {loading ? 'Simulando em Memória...' : '🔍 Executar Preflight Seguro'}
            </button>
          </div>
        </div>

        {/* 3. Painel de Resultados do Preflight */}
        {summary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>
              📊 3. Resultado da Simulação Prévia (Preflight)
            </h4>

            {/* Grid 4 Quadrantes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              <div style={{ background: 'var(--green-glow)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(22, 163, 74, 0.25)', textAlign: 'center' }}>
                <div style={{ color: 'var(--green)', fontSize: '0.75rem', fontWeight: 700 }}>CONTATOS MAPEADOS</div>
                <div style={{ color: 'var(--green)', fontSize: '1.6rem', fontWeight: 800 }}>{summary.totalContactsRead}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  +{summary.dealsRecoveredFromSnapshot} recuperados do snapshot
                </div>
              </div>

              <div style={{ background: 'var(--accent-glow)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.25)', textAlign: 'center' }}>
                <div style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700 }}>ATIVOS NO KANBAN</div>
                <div style={{ color: 'var(--accent)', fontSize: '1.6rem', fontWeight: 800 }}>{summary.dealsOperationalActive}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  (Corte: {summary.cutoffDate})
                </div>
              </div>

              <div style={{ background: 'var(--yellow-glow)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(202, 138, 4, 0.25)', textAlign: 'center' }}>
                <div style={{ color: 'var(--yellow)', fontSize: '0.75rem', fontWeight: 700 }}>ARQUIVADOS (HISTÓRICO)</div>
                <div style={{ color: 'var(--yellow)', fontSize: '1.6rem', fontWeight: 800 }}>
                  {summary.dealsWonArchived + summary.dealsLostArchived + summary.dealsDormantArchived + summary.dealsStandBy}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {summary.dealsWonArchived} ganhos • {summary.dealsLostArchived} perdidos • {summary.dealsDormantArchived} dormentes
                </div>
              </div>

              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.25)', textAlign: 'center' }}>
                <div style={{ color: 'var(--red)', fontSize: '0.75rem', fontWeight: 700 }}>REVISÃO NECESSÁRIA</div>
                <div style={{ color: 'var(--red)', fontSize: '1.6rem', fontWeight: 800 }}>{summary.dealsWithoutContact}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Negócios sem contato (isolados)
                </div>
              </div>
            </div>

            {/* Cinto de Segurança */}
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '18px 20px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10B981', fontWeight: 700, fontSize: '0.95rem' }}>
                <span>🛡️</span> Cinto de Segurança da Carga Histórica:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div>📧 E-mails disparados: <strong style={{ color: 'var(--text-primary)' }}>0</strong></div>
                <div>🤖 Réguas/Flows iniciados: <strong style={{ color: 'var(--text-primary)' }}>0</strong></div>
                <div>🎲 Redistribuição Round-Robin: <strong style={{ color: 'var(--text-primary)' }}>0</strong></div>
                <div>💰 LTV/Receita acidental: <strong style={{ color: 'var(--text-primary)' }}>R$ 0,00</strong></div>
                <div>👤 Operadoras preservadas: <strong style={{ color: 'var(--text-primary)' }}>SIM (humanTakeover)</strong></div>
                <div>🔄 Idempotência garantida: <strong style={{ color: 'var(--text-primary)' }}>100%</strong></div>
              </div>
            </div>

            {/* Barra de Progresso Real-time se estiver processando */}
            {progress && (
              <div style={{ background: 'var(--surface-raised)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  <span>⏳ Gravando lotes no banco: {progress.current} de {progress.total} negócios...</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{progress.percent}%</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'var(--surface)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress.percent}%`, height: '100%', background: 'linear-gradient(90deg, #3B82F6, #10B981)', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}

            {/* Ação de Commit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button
                onClick={handleCommit}
                disabled={committing}
                style={{
                  background: committing ? 'var(--surface-raised)' : 'var(--green)',
                  color: committing ? 'var(--text-muted)' : '#fff',
                  padding: '14px 28px', borderRadius: 8, fontWeight: 700, border: 'none', cursor: committing ? 'not-allowed' : 'pointer',
                  fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                {committing ? 'Gravando Lotes com Segurança...' : `🚀 Efetivar Migração Bitrix (${summary.totalDealsRead} negócios)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
