'use client';

import React, { useState, useEffect } from 'react';
import { RowPreflightResult, PreflightSummary } from '@/lib/services/ImportPreflightService';

export default function ImportV4Page() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<PreflightSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Products for alias selection
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // Fetch products for dropdown
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(console.error);
  }, []);

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
      
      // Re-run preflight to apply alias
      await handleUpload();
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
      setSuccess(`Importação concluída! Sucesso: ${result.successRows}, Erros: ${result.errorRows}`);
      setSummary(null);
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Importação V4 (CDP)</h1>
          <p className="text-gray-500 mt-2">Motor de ingestão com resolução canônica de identidade e catálogo.</p>
        </div>
        <div className="space-x-4">
          <a href="/api/leads/import/template?type=canonical" className="px-4 py-2 border rounded-md text-blue-600 hover:bg-blue-50 transition-colors">
            Baixar Template Completo
          </a>
          <a href="/api/leads/import/template?type=marketing" className="px-4 py-2 border rounded-md text-green-600 hover:bg-green-50 transition-colors">
            Baixar Template Marketing
          </a>
        </div>
      </header>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-4 rounded-md">{success}</div>}

      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">1. Enviar Arquivo</h2>
        <div className="flex items-center gap-4">
          <input 
            type="file" 
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full max-w-sm text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <button 
            onClick={handleUpload}
            disabled={!file || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Analisando...' : 'Fazer Pre-flight'}
          </button>
        </div>
      </section>

      {summary && (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">2. Resultado do Pre-flight</h2>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="text-green-800 text-sm font-bold">Prontos (READY)</div>
              <div className="text-2xl font-bold text-green-600">{summary.readyRows}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <div className="text-yellow-800 text-sm font-bold">Avisos (WARNING)</div>
              <div className="text-2xl font-bold text-yellow-600">{summary.warningRows}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <div className="text-red-800 text-sm font-bold">Erros (ERROR)</div>
              <div className="text-2xl font-bold text-red-600">{summary.errorRows}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="text-blue-800 text-sm font-bold">Revisão (HITL)</div>
              <div className="text-2xl font-bold text-blue-600">{summary.reviewRows}</div>
            </div>
          </div>

          {summary.reviewRows > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-200">
              <h3 className="text-lg font-bold text-blue-800 mb-4">Ação Necessária: Produtos Desconhecidos</h3>
              <p className="text-sm text-gray-600 mb-4">O catálogo não reconheceu as nomenclaturas abaixo. Mapeie para um produto oficial para prosseguir.</p>
              
              <div className="space-y-4">
                {summary.results.filter(r => r.status === 'REVIEW_REQUIRED').map((row) => (
                  <div key={row.index} className="flex items-center gap-4 p-4 border rounded-md bg-gray-50">
                    <div className="flex-1">
                      <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
                        {row.parsedData?.product_name || row.parsedData?.product_id}
                      </span>
                    </div>
                    <div className="flex-1">
                      <select 
                        className="w-full border p-2 rounded-md"
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

          <div className="flex justify-end pt-6 border-t">
            <button 
              onClick={handleCommit}
              disabled={committing || summary.reviewRows > 0}
              className="bg-green-600 text-white px-8 py-3 rounded-md font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {committing ? 'Comitando...' : `Finalizar Importação (${summary.readyRows + summary.warningRows} válidos)`}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
