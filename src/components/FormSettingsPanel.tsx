'use client';

import React from 'react';

interface FormSettingsPanelProps {
  pipelineId: string;
  setPipelineId: (id: string) => void;
  campaignId: string;
  setCampaignId: (id: string) => void;
  productId: string;
  setProductId: (id: string) => void;
  
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  buttonColor: string;
  setButtonColor: (color: string) => void;

  // Options populated from database
  pipelines?: { id: string; name: string }[];
  campaigns?: { id: string; name: string }[];
  products?: { id: string; name: string }[];
}

export default function FormSettingsPanel({
  pipelineId,
  setPipelineId,
  campaignId,
  setCampaignId,
  productId,
  setProductId,
  backgroundColor,
  setBackgroundColor,
  buttonColor,
  setButtonColor,
  pipelines = [],
  campaigns = [],
  products = []
}: FormSettingsPanelProps) {
  return (
    <div 
      className="card shadow-lg" 
      style={{
        width: '320px',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        padding: 20,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}
    >
      {/* Title */}
      <div>
        <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0' }}>
          ⚙️ Configurações do Form
        </h4>
        <p className="label-sm" style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>
          Configure as integrações, gatilhos de automação e estilo de exibição do formulário.
        </p>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

      {/* 1. Integrações & Destino */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🔗 Roteamento & Destino
        </div>

        <div>
          <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Funil de Destino (Pipeline):</label>
          <select
            value={pipelineId}
            onChange={(e) => setPipelineId(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', background: 'var(--surface-raised)',
              border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none'
            }}
          >
            <option value="">-- Selecione o Funil --</option>
            {pipelines.map(pipe => (
              <option key={pipe.id} value={pipe.id}>{pipe.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Campanha Associada:</label>
          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', background: 'var(--surface-raised)',
              border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none'
            }}
          >
            <option value="">-- Nenhuma Campanha --</option>
            {campaigns.map(camp => (
              <option key={camp.id} value={camp.id}>{camp.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Produto Ofertado:</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', background: 'var(--surface-raised)',
              border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none'
            }}
          >
            <option value="">-- Nenhum Produto --</option>
            {products.map(prod => (
              <option key={prod.id} value={prod.id}>{prod.name}</option>
            ))}
          </select>
          <p className="label-sm" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.3 }}>
            leads capturados por este formulário terão uma oportunidade criada associada a este produto e preço de tabela.
          </p>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

      {/* 2. Customização Visual (Design) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🎨 Customização Visual
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Cor de Fundo:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                style={{
                  width: 34, height: 34, padding: 0, border: 'none', borderRadius: '50%',
                  cursor: 'pointer', background: 'none'
                }}
              />
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {backgroundColor.toUpperCase()}
              </span>
            </div>
          </div>

          <div>
            <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Cor do Botão:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={buttonColor}
                onChange={(e) => setButtonColor(e.target.value)}
                style={{
                  width: 34, height: 34, padding: 0, border: 'none', borderRadius: '50%',
                  cursor: 'pointer', background: 'none'
                }}
              />
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {buttonColor.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 'auto 0 0 0' }} />
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
        DentalGO CRM v5.0 — RevOps Suite
      </div>
    </div>
  );
}
