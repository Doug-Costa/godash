'use client';

import React, { useState, useEffect } from 'react';
import { PreflightSummary, RowPreflightResult } from '@/lib/services/ImportPreflightService';
import type { CsvCanonicalField, CsvColumnMapping, CsvSchemaInspection } from '@/lib/services/CsvSchemaMappingService';

const CANONICAL_FIELD_OPTIONS: { value: CsvCanonicalField; label: string }[] = [
  { value: 'IGNORE', label: 'Ignorar (não importar)' },
  { value: 'name', label: 'Nome da pessoa' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone / WhatsApp' },
  { value: 'external_id', label: 'ID externo da pessoa' },
  { value: 'source_record_id', label: 'ID da matrícula/registro' },
  { value: 'product_id', label: 'Código do produto/curso' },
  { value: 'product_name', label: 'Nome do produto/curso' },
  { value: 'fact_status', label: 'Status da matrícula/fato' },
  { value: 'value', label: 'Valor financeiro' },
  { value: 'occurred_at', label: 'Data da ocorrência/compra' },
  { value: 'stage', label: 'Etapa do funil' },
  { value: 'campaign_name', label: 'Campanha' },
  { value: 'notes', label: 'Observações' },
  { value: 'seller', label: 'Vendedor' }
];

interface Product {
  id: string;
  name: string;
  category: string;
}

interface Pipeline {
  id: string;
  name: string;
}

interface AdminImportTabProps {
  products?: Product[];
  pipelines?: Pipeline[];
  onImportCompleted?: () => void;
}

export default function AdminImportTab({
  products = [],
  pipelines = [],
  onImportCompleted
}: AdminImportTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<PreflightSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaInspection, setSchemaInspection] = useState<CsvSchemaInspection | null>(null);
  const [columnMapping, setColumnMapping] = useState<CsvColumnMapping>({});
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [importDestination, setImportDestination] = useState<'DESEJO' | 'FATO'>('DESEJO');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tablePage, setTablePage] = useState(1);
  const pageSize = 10;

  // State for Alias Resolver Modal (HITL)
  const [aliasModal, setAliasModal] = useState<{ isOpen: boolean; rawValue: string } | null>(null);
  const [aliasTargetProductId, setAliasTargetProductId] = useState('');
  const [savingAlias, setSavingAlias] = useState(false);

  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [pipelines, selectedPipelineId]);

  const inspectFileSchema = async (selectedFile: File) => {
    setSchemaLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await fetch('/api/leads/import/schema', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(await response.text() || 'Falha ao identificar o layout do CSV.');
      const inspection: CsvSchemaInspection = await response.json();
      setSchemaInspection(inspection);
      setColumnMapping(Object.fromEntries(
        inspection.columns.map(column => [column.header, column.suggestedTarget])
      ));
    } catch (err: any) {
      setSchemaInspection(null);
      setColumnMapping({});
      setError(err.message);
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setSummary(null);
      setSchemaInspection(null);
      setColumnMapping({});
      setError(null);
      setSuccessMsg(null);
      setTablePage(1);
      void inspectFileSchema(selectedFile);
    }
  };

  const handleAnalyzePreflight = async () => {
    if (!file) {
      alert('Selecione um arquivo CSV para analisar.');
      return;
    }

    if (!schemaInspection) {
      setError('Aguarde a inspeção do layout antes de executar o Preflight.');
      return;
    }

    const mappedTargets = new Set<CsvCanonicalField>(Object.values(columnMapping));
    if (!['name', 'email', 'phone', 'external_id'].some(field => mappedTargets.has(field as CsvCanonicalField))) {
      setError('Mapeie ao menos Nome, E-mail, Telefone ou ID externo para resolver a identidade.');
      return;
    }
    if (importDestination === 'FATO' && !selectedProductId && !mappedTargets.has('product_id') && !mappedTargets.has('product_name')) {
      setError('Carga FATO exige Produto/Curso no CSV ou um Produto Padrão selecionado.');
      return;
    }

    setLoading(true);
    setError(null);
    setSummary(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(columnMapping));

    try {
      const res = await fetch('/api/leads/import/preflight', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Erro ao processar o arquivo CSV.');
      }

      const data = await res.json();
      setSummary(data);
      setTablePage(1);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!summary) return;

    const approvedRows = summary.results.filter(r => r.status === 'READY' || r.status === 'WARNING');
    if (approvedRows.length === 0) {
      alert('Nenhuma linha elegível para importação (apenas linhas READY ou WARNING são aceitas).');
      return;
    }

    if (!confirm(`Deseja confirmar a importação de ${approvedRows.length} registro(s) para o banco de dados?`)) {
      return;
    }

    setCommitting(true);
    setError(null);

    try {
      const res = await fetch('/api/leads/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchInfo: {
            fileName: file?.name || 'importacao_v4.csv',
            schemaVersion: 'V4',
            importDestination,
            productId: selectedProductId || undefined,
            pipelineId: selectedPipelineId || undefined
          },
          rows: approvedRows
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Falha ao efetuar commit no banco.');
      }

      const result = await res.json();
      setSuccessMsg(`✅ Importação concluída com sucesso! ${result.successRows} registros gravados.`);
      setSummary(null);
      setFile(null);

      if (onImportCompleted) {
        onImportCompleted();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setCommitting(false);
    }
  };

  const handleSaveAlias = async () => {
    if (!aliasModal || !aliasTargetProductId) {
      alert('Selecione o produto de destino.');
      return;
    }

    setSavingAlias(true);
    try {
      const res = await fetch('/api/leads/import/alias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawValue: aliasModal.rawValue,
          productId: aliasTargetProductId
        })
      });

      if (!res.ok) {
        throw new Error('Erro ao registrar alias do produto.');
      }

      setAliasModal(null);
      setAliasTargetProductId('');
      // Re-analisar o arquivo automaticamente
      await handleAnalyzePreflight();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingAlias(false);
    }
  };

  // Filtragem de linhas da tabela
  const filteredRows = summary?.results.filter(r => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  }) || [];

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((tablePage - 1) * pageSize, tablePage * pageSize);

  return (
    <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            📥 Ingestão & Importação de Dados (Motor V4)
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Importação em lote de Leads, Oportunidades de Funil e Histórico de Compras ERP com resolução automática de duplicados.
          </p>
        </div>

        <a
          href="/api/leads/import/template"
          download="modelo_importacao_v4.csv"
          className="btn-action btn-action-outline"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
        >
          📄 Baixar Planilha Modelo (CSV)
        </a>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="card animate-fadeUp" style={{ padding: 16, background: 'rgba(74, 222, 128, 0.1)', borderColor: '#4ADE80', color: '#4ADE80', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>{successMsg}</div>
          <button onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#4ADE80', cursor: 'pointer', fontSize: 18 }}>&times;</button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="card animate-fadeUp" style={{ padding: 16, background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--red)', color: 'var(--red)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>❌ {error}</div>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 18 }}>&times;</button>
        </div>
      )}

      {/* 1. Configuration Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* Destination Card */}
        <div className="card" style={{ padding: 20, background: 'var(--surface)' }}>
          <h4 style={{ color: 'var(--text-primary)', margin: '0 0 12px', fontSize: 13, fontWeight: 700 }}>
            1. Escolha o Tipo de Carga
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div
              onClick={() => setImportDestination('DESEJO')}
              style={{
                padding: 14,
                borderRadius: 10,
                border: `2px solid ${importDestination === 'DESEJO' ? 'var(--accent)' : 'var(--border)'}`,
                background: importDestination === 'DESEJO' ? 'var(--accent-glow)' : 'var(--surface-raised)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>🎯</div>
              <strong style={{ color: 'var(--text-primary)', fontSize: 13, display: 'block' }}>Funil de Vendas (DESEJO)</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cria cards de oportunidade no Kanban para os vendedores atenderem.</span>
            </div>

            <div
              onClick={() => setImportDestination('FATO')}
              style={{
                padding: 14,
                borderRadius: 10,
                border: `2px solid ${importDestination === 'FATO' ? 'var(--accent)' : 'var(--border)'}`,
                background: importDestination === 'FATO' ? 'var(--accent-glow)' : 'var(--surface-raised)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>📦</div>
              <strong style={{ color: 'var(--text-primary)', fontSize: 13, display: 'block' }}>Compras ERP (FATO)</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Grava histórico de compras de cursos/planos e soma ao LTV do cliente.</span>
            </div>
          </div>
        </div>

        {/* Association & Fallbacks Card */}
        <div className="card" style={{ padding: 20, background: 'var(--surface)' }}>
          <h4 style={{ color: 'var(--text-primary)', margin: '0 0 12px', fontSize: 13, fontWeight: 700 }}>
            2. Destinos Padrão (Fallback)
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {importDestination === 'DESEJO' && (
              <div>
                <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>Pipeline de Entrada:</label>
                <select
                  value={selectedPipelineId}
                  onChange={(e) => setSelectedPipelineId(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', background: 'var(--surface-raised)',
                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13
                  }}
                >
                  {pipelines.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 4 }}>
                Produto Padrão (para linhas sem product_id/produto no CSV):
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13
                }}
              >
                <option value="">-- Mapear dinamicamente pela coluna do CSV --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* 2. File Upload & Dropzone */}
      <div className="card" style={{ padding: 24, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 13, fontWeight: 700 }}>
          3. Selecione o Arquivo CSV
        </h4>

        <div style={{
          border: '2px dashed var(--border)', borderRadius: 12, padding: 32,
          textAlign: 'center', background: 'var(--surface-raised)', display: 'flex',
          flexDirection: 'column', alignItems: 'center', gap: 12
        }}>
          <input
            type="file"
            id="csv-upload-input"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <span style={{ fontSize: 36 }}>📊</span>
          
          <div>
            <label
              htmlFor="csv-upload-input"
              className="btn-action btn-action-outline"
              style={{ display: 'inline-block', cursor: 'pointer', padding: '8px 16px', fontSize: 13 }}
            >
              {file ? 'Trocar Arquivo CSV' : 'Escolher Arquivo CSV'}
            </label>
            {file && (
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                📁 {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
            Suporta colunas: <code>nome</code>, <code>email</code>, <code>telefone</code>, <code>valor</code>, <code>produto</code>, <code>stage</code>.
          </p>
        </div>

        {file && schemaLoading && (
          <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-raised)', color: 'var(--text-muted)', fontSize: 12 }}>
            ⏳ Detectando delimitador, cabeçalho e significado das colunas...
          </div>
        )}

        {file && schemaInspection && !summary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)' }}>4. Confirme o Mapeamento Canônico</h4>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                  Cabeçalho na linha {schemaInspection.headerRow} · delimitador {schemaInspection.delimiter === '\t' ? 'TAB' : `“${schemaInspection.delimiter}”`} · {schemaInspection.totalColumns} colunas
                </p>
              </div>
              <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(251, 191, 36, 0.12)', color: '#FBBF24', fontSize: 11 }}>
                Colunas em “Ignorar” não criam campos nem dados no cliente.
              </div>
            </div>

            <div className="table-container" style={{ maxHeight: 420, overflow: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Coluna recebida</th>
                    <th>Amostras</th>
                    <th>Destino canônico</th>
                    <th>Diagnóstico</th>
                  </tr>
                </thead>
                <tbody>
                  {schemaInspection.columns.map(column => {
                    const target = columnMapping[column.header] || 'IGNORE';
                    return (
                      <tr key={column.header}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{column.header}</td>
                        <td style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 300 }}>
                          {column.samples.length > 0 ? column.samples.join(' · ') : '—'}
                        </td>
                        <td>
                          <select
                            value={target}
                            onChange={event => setColumnMapping(current => ({
                              ...current,
                              [column.header]: event.target.value as CsvCanonicalField
                            }))}
                            style={{
                              width: '100%', minWidth: 210, padding: '7px 10px', borderRadius: 7,
                              border: `1px solid ${target === 'IGNORE' ? 'var(--border)' : 'var(--accent)'}`,
                              background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 12
                            }}
                          >
                            {CANONICAL_FIELD_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ fontSize: 11, color: target === 'IGNORE' ? '#FBBF24' : '#4ADE80' }}>
                          {target === 'IGNORE' ? `Ignorada: ${column.reason}` : column.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {file && schemaInspection && !summary && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleAnalyzePreflight}
              disabled={loading || schemaLoading}
              className="btn-action btn-action-purple"
              style={{ padding: '10px 24px', fontSize: 13, background: 'var(--accent)', borderColor: 'var(--accent)', color: '#000' }}
            >
              {loading ? '⏳ Analisando Motor V4...' : '🔍 Confirmar Mapeamento e Executar Preflight'}
            </button>
          </div>
        )}
      </div>

      {/* 3. Preflight Results & Review */}
      {summary && (
        <div className="card animate-fadeUp" style={{ padding: 24, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
            <div>
              <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                🔎 Resultado da Inspeção Canônica (Preflight)
              </h4>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Total de Linhas Analisadas: <strong>{summary.totalRows}</strong>
              </span>
            </div>

            {/* Quick Filters */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => { setStatusFilter('ALL'); setTablePage(1); }}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: statusFilter === 'ALL' ? 'var(--text-primary)' : 'var(--surface-raised)',
                  color: statusFilter === 'ALL' ? 'var(--surface)' : 'var(--text-secondary)'
                }}
              >
                Todos ({summary.totalRows})
              </button>
              <button
                onClick={() => { setStatusFilter('READY'); setTablePage(1); }}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: statusFilter === 'READY' ? '#4ADE80' : 'rgba(74, 222, 128, 0.1)',
                  color: statusFilter === 'READY' ? '#000' : '#4ADE80'
                }}
              >
                Prontos ({summary.readyRows})
              </button>
              <button
                onClick={() => { setStatusFilter('WARNING'); setTablePage(1); }}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: statusFilter === 'WARNING' ? '#FBBF24' : 'rgba(251, 191, 36, 0.1)',
                  color: statusFilter === 'WARNING' ? '#000' : '#FBBF24'
                }}
              >
                Alertas ({summary.warningRows})
              </button>
              <button
                onClick={() => { setStatusFilter('REVIEW_REQUIRED'); setTablePage(1); }}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: statusFilter === 'REVIEW_REQUIRED' ? '#A78BFA' : 'rgba(167, 139, 250, 0.1)',
                  color: statusFilter === 'REVIEW_REQUIRED' ? '#000' : '#A78BFA'
                }}
              >
                Revisão ({summary.reviewRows})
              </button>
              <button
                onClick={() => { setStatusFilter('ERROR'); setTablePage(1); }}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: statusFilter === 'ERROR' ? '#F87171' : 'rgba(248, 113, 113, 0.1)',
                  color: statusFilter === 'ERROR' ? '#000' : '#F87171'
                }}
              >
                Erros ({summary.errorRows})
              </button>
            </div>
          </div>

          {/* Table Preview */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>Status</th>
                  <th>Contato (Nome / Email / Fone)</th>
                  <th>Identidade V4</th>
                  <th>Produto / Fato</th>
                  <th>Diagnóstico</th>
                  <th style={{ textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      Nenhuma linha encontrada com o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map(row => {
                    const parsed = row.parsedData;
                    const badgeBg = row.status === 'READY' ? 'rgba(74, 222, 128, 0.15)' :
                      row.status === 'WARNING' ? 'rgba(251, 191, 36, 0.15)' :
                      row.status === 'REVIEW_REQUIRED' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(248, 113, 113, 0.15)';
                    const badgeColor = row.status === 'READY' ? '#4ADE80' :
                      row.status === 'WARNING' ? '#FBBF24' :
                      row.status === 'REVIEW_REQUIRED' ? '#A78BFA' : '#F87171';

                    return (
                      <tr key={row.index}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{row.index + 1}</td>
                        <td>
                          <span style={{
                            padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                            background: badgeBg, color: badgeColor, textTransform: 'uppercase'
                          }}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{parsed?.name || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{parsed?.email || parsed?.phone || 'Sem contato'}</div>
                        </td>
                        <td>
                          <span className="badge badge-neu" style={{ fontSize: 10 }}>
                            {row.identityStatus === 'FOUND' && '🟢 Reconhecido'}
                            {row.identityStatus === 'NOT_FOUND' && '🟡 Nova Pessoa'}
                            {row.identityStatus === 'AMBIGUOUS' && '🔴 Ambíguo'}
                            {row.identityStatus === 'NOT_REQUIRED' && '⚪ N/A'}
                          </span>
                        </td>
                        <td>
                          <div>{row.resolvedProductName || parsed?.product_name || parsed?.product_id || '—'}</div>
                          {parsed?.value !== undefined && (
                            <div style={{ fontSize: 11, color: 'var(--accent)' }}>
                              R$ {parsed.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: 11 }}>
                          {row.errors.length > 0 && (
                            <div style={{ color: '#F87171' }}>{row.errors.join('; ')}</div>
                          )}
                          {row.warnings.length > 0 && (
                            <div style={{ color: '#FBBF24' }}>{row.warnings.join('; ')}</div>
                          )}
                          {row.errors.length === 0 && row.warnings.length === 0 && (
                            <div style={{ color: 'var(--text-muted)' }}>Linha validada com sucesso.</div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {row.status === 'REVIEW_REQUIRED' && (parsed?.product_name || parsed?.product_id) && (
                            <button
                              onClick={() => {
                                setAliasModal({ isOpen: true, rawValue: parsed?.product_name || parsed?.product_id || '' });
                              }}
                              className="btn-action btn-action-outline"
                              style={{ fontSize: 10, padding: '3px 8px' }}
                            >
                              🔗 Mapear Produto
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Página {tablePage} de {totalPages} ({filteredRows.length} linhas)
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={tablePage === 1}
                  onClick={() => setTablePage(p => Math.max(1, p - 1))}
                  className="btn-action btn-action-outline"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                >
                  ◀️ Anterior
                </button>
                <button
                  disabled={tablePage === totalPages}
                  onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                  className="btn-action btn-action-outline"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                >
                  Próxima ▶️
                </button>
              </div>
            </div>
          )}

          {/* Commit Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => { setSummary(null); setFile(null); }}
              className="btn-action btn-action-outline"
              style={{ padding: '10px 20px', fontSize: 12 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleCommit}
              disabled={committing || (summary.readyRows + summary.warningRows === 0)}
              className="btn-action btn-action-purple"
              style={{
                padding: '10px 24px', fontSize: 12,
                background: 'var(--accent)', borderColor: 'var(--accent)', color: '#000',
                opacity: (summary.readyRows + summary.warningRows === 0) ? 0.5 : 1
              }}
            >
              {committing ? '⏳ Gravando Registros...' : `🚀 Confirmar & Gravar ${summary.readyRows + summary.warningRows} Linha(s)`}
            </button>
          </div>

        </div>
      )}

      {/* Alias Resolver Modal (HITL) */}
      {aliasModal?.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
        }}>
          <div className="card animate-fadeUp" style={{ width: '100%', maxWidth: '460px', background: 'var(--surface)', padding: 24, borderRadius: 16 }}>
            <h4 style={{ color: 'var(--text-primary)', margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>
              🔗 Mapeamento Canônico de Produto (HITL)
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              A string <code>&quot;{aliasModal.rawValue}&quot;</code> presente na planilha não foi encontrada no catálogo. Selecione qual produto oficial ela representa:
            </p>

            <div style={{ marginBottom: 20 }}>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Produto Oficial Correspondente:</label>
              <select
                value={aliasTargetProductId}
                onChange={(e) => setAliasTargetProductId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13
                }}
              >
                <option value="">-- Escolha o produto oficial --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setAliasModal(null)}
                className="btn-action btn-action-outline"
                style={{ fontSize: 12, padding: '8px 16px' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAlias}
                disabled={savingAlias || !aliasTargetProductId}
                className="btn-action btn-action-purple"
                style={{ fontSize: 12, padding: '8px 16px', background: 'var(--accent)', borderColor: 'var(--accent)', color: '#000' }}
              >
                {savingAlias ? 'Salvando...' : 'Salvar Alias e Re-analisar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
