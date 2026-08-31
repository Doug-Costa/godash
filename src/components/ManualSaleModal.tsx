'use client';

import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  basePrice: number | null;
  category: string;
  subType: string;
}

interface ManualSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (saleData: any) => void;
  products: Product[];
}

export default function ManualSaleModal({
  isOpen,
  onClose,
  onSave,
  products = []
}: ManualSaleModalProps) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [pricePaidDisplay, setPricePaidDisplay] = useState('');
  const [pricePaidRaw, setPricePaidRaw] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [isLifetime, setIsLifetime] = useState(true);
  const [validUntil, setValidUntil] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [saleChannel, setSaleChannel] = useState('BALCAO_MANUAL');

  // Pre-fill today's date on open
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setSelectedProductId('');
      setPricePaidDisplay('');
      setPricePaidRaw(null);
      setIsLifetime(true);
      setValidUntil('');
      setStatus('ACTIVE');
      setSaleChannel('BALCAO_MANUAL');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = e.target.value;
    setSelectedProductId(prodId);
    
    const prod = products.find(p => p.id === prodId);
    if (prod && prod.basePrice !== null) {
      setPricePaidRaw(prod.basePrice);
      setPricePaidDisplay(formatCurrency(prod.basePrice));
    } else {
      setPricePaidRaw(null);
      setPricePaidDisplay('');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/\D/g, '');
    if (cleanValue === '') {
      setPricePaidDisplay('');
      setPricePaidRaw(null);
      return;
    }

    const numericValue = Number(cleanValue) / 100;
    setPricePaidRaw(numericValue);
    setPricePaidDisplay(formatCurrency(numericValue));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Por favor, selecione um produto.');
      return;
    }

    onSave({
      productId: selectedProductId,
      pricePaid: pricePaidRaw,
      startDate: startDate || null,
      validUntil: isLifetime ? null : (validUntil || null),
      status,
      saleChannel,
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
    }}>
      <div className="card animate-fadeUp" style={{
        width: '100%', maxWidth: '500px', background: 'var(--surface)', padding: 24,
        borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
        boxSizing: 'border-box'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            🛒 Registrar Venda Manual
          </h3>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div>
            <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Selecionar Produto:</label>
            <select
              required
              value={selectedProductId}
              onChange={handleProductChange}
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none'
              }}
            >
              <option value="">-- Escolha um produto --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category} • {p.subType.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Preço Pago (BRL):</label>
              <input
                type="text"
                required
                value={pricePaidDisplay}
                onChange={handlePriceChange}
                placeholder="R$ 0,00"
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--accent)', fontWeight: 600, outline: 'none', fontSize: 13, boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Canal de Venda:</label>
              <select
                value={saleChannel}
                onChange={(e) => setSaleChannel(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                }}
              >
                <option value="BALCAO_MANUAL">Balcão Manual</option>
                <option value="IMPORTACAO_V4">Importação Planilha V4</option>
                <option value="INTEGRACAO_EVOLUTION">Evolution API (WhatsApp)</option>
                <option value="DENTALGO_BILLING">DentalGO Faturamento</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Data da Venda:</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13, boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Status da Assinatura/Curso:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                }}
              >
                <option value="ACTIVE">Ativo</option>
                <option value="COMPLETED">Concluído</option>
                <option value="EXPIRED">Expirado</option>
                <option value="CANCELED">Cancelado</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--surface-raised)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isLifetime}
                onChange={(e) => setIsLifetime(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
              Acesso Vitalício (Sem expiração)
            </label>

            {!isLifetime && (
              <div style={{ marginTop: 8 }} className="animate-fadeUp">
                <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Expira em / Válido até:</label>
                <input
                  type="date"
                  required={!isLifetime}
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13, boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-action btn-action-outline"
              style={{ padding: '10px 20px', borderRadius: 8, fontSize: 12 }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-action btn-action-purple"
              style={{ padding: '10px 20px', borderRadius: 8, fontSize: 12, background: 'var(--accent)', borderColor: 'var(--accent)', color: '#000' }}
            >
              Confirmar Venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
