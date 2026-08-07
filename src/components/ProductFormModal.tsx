'use client';

import React, { useState } from 'react';

// Categorias e subtipos de produtos da taxonomia RevOps
const PRODUCT_CATEGORIES = ['CURSO', 'CONGRESSO', 'SAAS', 'LIVRO', 'INSTITUCIONAL'];
const PRODUCT_SUB_TYPES = [
  'IMERSAO',
  'APERFEICOAMENTO',
  'ESPECIALIZACAO',
  'EXCELENCIA',
  'PARCERIA',
  'PRESENCIAL',
  'ONLINE',
  'LIVRO_FISICO',
  'LIVRO_DIGITAL'
];

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: {
    name: string;
    category: string;
    subType: string;
    basePrice: number;
  }) => void;
}

export default function ProductFormModal({ isOpen, onClose, onSave }: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('CURSO');
  const [subType, setSubType] = useState('ONLINE');
  const [priceRaw, setPriceRaw] = useState(0);
  const [priceDisplay, setPriceDisplay] = useState('');

  if (!isOpen) return null;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não for dígito
    const cleanValue = e.target.value.replace(/\D/g, '');
    const numericValue = Number(cleanValue) / 100;
    setPriceRaw(numericValue);
    
    if (cleanValue === '') {
      setPriceDisplay('');
      setPriceRaw(0);
      return;
    }

    setPriceDisplay(
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(numericValue)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('O nome do produto é obrigatório.');
      return;
    }
    onSave({
      name,
      category,
      subType,
      basePrice: priceRaw,
    });
    // Reset form
    setName('');
    setCategory('CURSO');
    setSubType('ONLINE');
    setPriceRaw(0);
    setPriceDisplay('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050
    }}>
      <div className="card animate-fadeUp" style={{ 
        width: '100%', maxWidth: '480px', background: 'var(--surface)', padding: 24, 
        borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', boxSizing: 'border-box'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            📦 Novo Produto RevOps
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
            <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nome do Produto:</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Especialização em Ortopedia e Ortodontia"
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Categoria:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                }}
              >
                {PRODUCT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Subtipo:</label>
              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                }}
              >
                {PRODUCT_SUB_TYPES.map(sub => (
                  <option key={sub} value={sub}>{sub.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Preço de Tabela / Base (BRL):</label>
            <input
              type="text"
              required
              value={priceDisplay}
              onChange={handlePriceChange}
              placeholder="R$ 0,00"
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                border: '1px solid var(--border)', borderRadius: 8, color: 'var(--accent)', fontWeight: 600, outline: 'none', fontSize: 13
              }}
            />
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
              Salvar Produto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
