'use client';

import React, { useState } from 'react';
import { X, UploadCloud, UserPlus, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';

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

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setIsUploading(true);
    setUploadResult(null);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch('/api/leads/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'csv',
              pipelineId: csvPipelineId,
              source: 'CSV',
              rows: results.data
            })
          });

          const json = await res.json();
          if (res.ok) {
            setUploadResult({
              success: json.successCount || 0,
              failed: json.failedCount || 0,
              total: results.data.length
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
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            Adicionar Novo Lead
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'manual' ? 'border-b-2 border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'}`}
            onClick={() => setActiveTab('manual')}
          >
            Entrada Manual
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'csv' ? 'border-b-2 border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'}`}
            onClick={() => setActiveTab('csv')}
          >
            Importação via CSV
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={manualData.name}
                  onChange={e => setManualData({...manualData, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={manualData.email}
                    onChange={e => setManualData({...manualData, email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="joao@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Telefone (WhatsApp)</label>
                  <input 
                    type="text" 
                    required
                    value={manualData.phone}
                    onChange={e => setManualData({...manualData, phone: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Funil de Destino</label>
                <select 
                  value={manualData.pipelineId}
                  onChange={e => setManualData({...manualData, pipelineId: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {pipelines.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isUploading ? 'Adicionando...' : 'Adicionar Lead'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'csv' && (
            <div className="space-y-6">
              
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> Instruções do CSV
                </h3>
                <p className="text-xs text-slate-500 mb-2">O arquivo CSV deve conter um cabeçalho na primeira linha. As colunas reconhecidas são:</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300">nome</span>
                  <span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300">email</span>
                  <span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300">telefone</span>
                  <span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300">stage</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Funil de Destino</label>
                <select 
                  value={csvPipelineId}
                  onChange={e => setCsvPipelineId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {pipelines.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:bg-slate-800/50 transition-colors">
                <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-4">
                  {csvFile ? csvFile.name : 'Arraste seu arquivo CSV ou clique para selecionar'}
                </p>
                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                  Selecionar Arquivo
                  <input type="file" accept=".csv" className="hidden" onChange={e => setCsvFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              {uploadResult && (
                <div className={`p-4 rounded-lg border ${uploadResult.failed === 0 ? 'bg-emerald-900/20 border-emerald-900/50' : 'bg-amber-900/20 border-amber-900/50'}`}>
                  <div className="flex items-center gap-3">
                    {uploadResult.failed === 0 ? <CheckCircle className="text-emerald-500 w-5 h-5" /> : <AlertTriangle className="text-amber-500 w-5 h-5" />}
                    <div>
                      <p className={`text-sm font-medium ${uploadResult.failed === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        Importação Concluída
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {uploadResult.success} leads importados com sucesso. {uploadResult.failed} falhas. Total processado: {uploadResult.total}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleCsvUpload}
                  disabled={!csvFile || isUploading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
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
