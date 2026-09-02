'use client';

import React, { useState, useEffect } from 'react';
import { DENTAL_SPECIALTIES } from '@/lib/services/SpecialtyClassifierService';

// Categorias e subtipos de produtos da taxonomia RevOps
const PRODUCT_CATEGORIES = ['CURSO', 'CONGRESSO', 'SAAS', 'LIVRO', 'INSTITUCIONAL'];
const PRODUCT_SUB_TYPES = [
  'IMERSAO',
  'APERFEICOAMENTO',
  'ESPECIALIZACAO',
  'EXCELENCIA',
  'PRESENCIAL',
  'ONLINE',
  'FISICO',
  'DIGITAL',
  'ASSINATURA',
  'PARCERIA',
  'LIVRO_FISICO',
  'LIVRO_DIGITAL'
];

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: any) => void;
  editingProduct?: any;
  campaigns?: any[];
}

export default function ProductFormModal({ isOpen, onClose, onSave, editingProduct, campaigns = [] }: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('CURSO');
  const [subType, setSubType] = useState('ONLINE');
  const [specialty, setSpecialty] = useState('ORTODONTIA');
  const [priceRaw, setPriceRaw] = useState(0);
  const [priceDisplay, setPriceDisplay] = useState('');
  const [pricePaidRaw, setPricePaidRaw] = useState(0);
  const [pricePaidDisplay, setPricePaidDisplay] = useState('');
  const [cohort, setCohort] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [postSaleCampaignId, setPostSaleCampaignId] = useState('');
  const [nurturingCampaignId, setNurturingCampaignId] = useState('');

  // Load editing product data when modal opens or editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || '');
      setDescription(editingProduct.description || '');
      setCategory(editingProduct.category || 'CURSO');
      setSubType(editingProduct.subType || 'ONLINE');
      setSpecialty(editingProduct.specialty || 'ORTODONTIA');
      
      const basePr = editingProduct.basePrice || 0;
      setPriceRaw(basePr);
      setPriceDisplay(basePr > 0 ? formatCurrency(basePr) : '');

      const pr = editingProduct.price || 0;
      setPricePaidRaw(pr);
      setPricePaidDisplay(pr > 0 ? formatCurrency(pr) : '');

      setCohort(editingProduct.cohort || '');
      setStartDate(editingProduct.startDate ? new Date(editingProduct.startDate).toISOString().split('T')[0] : '');
      setEndDate(editingProduct.endDate ? new Date(editingProduct.endDate).toISOString().split('T')[0] : '');
      setIsActive(editingProduct.isActive !== undefined ? editingProduct.isActive : true);
      setPostSaleCampaignId(editingProduct.postSaleCampaignId || '');
      setNurturingCampaignId(editingProduct.nurturingCampaignId || '');
    } else {
      // Reset to defaults
      setName('');
      setDescription('');
      setCategory('CURSO');
      setSubType('ONLINE');
      setSpecialty('ORTODONTIA');
      setPriceRaw(0);
      setPriceDisplay('');
      setPricePaidRaw(0);
      setPricePaidDisplay('');
      setCohort('');
      setStartDate('');
      setEndDate('');
      setIsActive(true);
      setPostSaleCampaignId('');
      setNurturingCampaignId('');
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'base' | 'price') => {
    const cleanValue = e.target.value.replace(/\D/g, '');
    if (cleanValue === '') {
      if (type === 'base') {
        setPriceDisplay('');
        setPriceRaw(0);
      } else {
        setPricePaidDisplay('');
        setPricePaidRaw(0);
      }
      return;
    }

    const numericValue = Number(cleanValue) / 100;
    if (type === 'base') {
      setPriceRaw(numericValue);
      setPriceDisplay(formatCurrency(numericValue));
    } else {
      setPricePaidRaw(numericValue);
      setPricePaidDisplay(formatCurrency(numericValue));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('O nome do produto é obrigatório.');
      return;
    }
    
    const payload: any = {
      name,
      description: description || null,
      category,
      subType,
      specialty: specialty || null,
      basePrice: priceRaw,
      price: pricePaidRaw || priceRaw,
      cohort: cohort || null,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive,
      postSaleCampaignId: postSaleCampaignId || null,
      nurturingCampaignId: nurturingCampaignId || null,
    };

    if (editingProduct && editingProduct.id) {
      payload.id = editingProduct.id;
    }

    onSave(payload);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
    }}>
      <div className="card animate-fadeUp" style={{
        width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)', boxSizing: 'border-box'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            📦 {editingProduct ? 'Editar Produto / Curso / Livro' : 'Cadastrar Novo Produto (RevOps)'}
          </h3>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nome do Produto / Curso:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Especialização em Ortodontia"
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13, boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ marginLeft: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <label className="label-sm" style={{ fontWeight: 600 }}>Ativo?</label>
              <input 
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>

          <div>
            <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Descrição:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o produto, e.g., carga horária, público alvo..."
              rows={2}
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13, boxSizing: 'border-box', resize: 'vertical'
              }}
            />
          </div>

          {/* Specialty, Category & SubType Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Especialidade / Área:</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, outline: 'none'
                }}
              >
                {Object.values(DENTAL_SPECIALTIES).map(spec => (
                  <option key={spec.key} value={spec.key}>{spec.icon} {spec.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Categoria:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, outline: 'none'
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
                  width: '100%', padding: '10px 12px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, outline: 'none'
                }}
              >
                {PRODUCT_SUB_TYPES.map(st => (
                  <option key={st} value={st}>{st.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Preço de Tabela (BRL):</label>
              <input
                type="text"
                value={priceDisplay}
                onChange={(e) => handlePriceChange(e, 'base')}
                placeholder="R$ 0,00"
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--accent)', fontWeight: 600, outline: 'none', fontSize: 13, boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Preço Promocional / Praticado:</label>
              <input
                type="text"
                value={pricePaidDisplay}
                onChange={(e) => handlePriceChange(e, 'price')}
                placeholder="R$ 0,00"
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 13, boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Turma / Edição:</label>
              <input
                type="text"
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                placeholder="Ex: Turma 2026.1"
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 12, boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Início das Aulas:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 12, boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Término:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--surface-raised)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontSize: 12, boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 12, background: 'var(--surface-raised)', borderRadius: 8 }}>
            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Ao ganhar → campanha de pós-venda:</label>
              <select value={postSaleCampaignId} onChange={e => setPostSaleCampaignId(e.target.value)} style={{ width: '100%', padding: '9px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6 }}>
                <option value="">-- Nenhuma --</option>
                {campaigns.filter(c => c.campaignNature === 'AUTOMATED').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-sm" style={{ display: 'block', marginBottom: 6 }}>Ao perder → campanha de nutrição:</label>
              <select value={nurturingCampaignId} onChange={e => setNurturingCampaignId(e.target.value)} style={{ width: '100%', padding: '9px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6 }}>
                <option value="">-- Nenhuma --</option>
                {campaigns.filter(c => c.campaignNature === 'AUTOMATED').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
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
              {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
