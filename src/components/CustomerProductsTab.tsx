'use client';

import React from 'react';

interface CustomerProduct {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    subType: string;
  };
  status: string; // ACTIVE, CANCELED, EXPIRED, COMPLETED
  startDate: string | Date | null;
  endDate: string | Date | null;
  pricePaid: number | null;
  saleChannel: string | null;
}

interface CustomerProductsTabProps {
  customerProducts: CustomerProduct[];
  onRegisterManualSale?: () => void;
}

export default function CustomerProductsTab({
  customerProducts = [],
  onRegisterManualSale
}: CustomerProductsTabProps) {

  const formatPrice = (val: number | null) => {
    if (val === null || val === undefined) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  const formatDate = (dateVal: string | Date | null) => {
    if (!dateVal) return 'Sem data';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Data inválida';
    return d.toLocaleDateString('pt-BR');
  };

  const renderStatusBadge = (status: string) => {
    const norm = status?.toUpperCase() || 'ACTIVE';
    let badgeColor = 'var(--text-secondary)';
    let badgeBg = 'var(--surface-raised)';
    let badgeBorder = 'var(--border)';
    let label = norm;

    if (norm === 'ACTIVE' || norm === 'ATIVO') {
      badgeColor = 'var(--green)';
      badgeBg = 'var(--green-glow)';
      badgeBorder = 'rgba(74, 222, 128, 0.3)';
      label = 'Ativo';
    } else if (norm === 'EXPIRED' || norm === 'EXPIRADO') {
      badgeColor = 'var(--yellow)';
      badgeBg = 'var(--yellow-glow)';
      badgeBorder = 'rgba(250, 204, 21, 0.3)';
      label = 'Expirado';
    } else if (norm === 'CANCELED' || norm === 'CANCELADO') {
      badgeColor = 'var(--red)';
      badgeBg = 'var(--red-glow)';
      badgeBorder = 'rgba(248, 113, 113, 0.3)';
      label = 'Cancelado';
    } else if (norm === 'COMPLETED' || norm === 'CONCLUIDO') {
      badgeColor = 'var(--purple)';
      badgeBg = 'var(--purple-glow)';
      badgeBorder = 'rgba(192, 132, 252, 0.3)';
      label = 'Concluído';
    }

    return (
      <span 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 10px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          color: badgeColor,
          background: badgeBg,
          border: `1px solid ${badgeBorder}`,
          textTransform: 'capitalize'
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tab Header Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            🛒 Portfólio de Aquisições
          </h4>
          <p className="label-sm" style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>
            Produtos, cursos e planos ativos vinculados a este lead comercial.
          </p>
        </div>
        
        {onRegisterManualSale && (
          <button 
            onClick={onRegisterManualSale}
            className="btn-action btn-action-purple"
            style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ➕ Registrar Venda Manual
          </button>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

      {/* Grid of Product Cards */}
      {customerProducts.length === 0 ? (
        <div 
          style={{
            textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--border)',
            borderRadius: 12, color: 'var(--text-muted)', fontSize: 13
          }}
        >
          📭 Nenhum produto cadastrado para este cliente até o momento.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {customerProducts.map((cp) => (
            <div 
              key={cp.id}
              className="card animate-fadeUp"
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                transition: 'transform 0.2s, border-color 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              {/* Product Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
                <div>
                  <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                    {cp.product?.name || 'Produto Não Identificado'}
                  </h5>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {cp.product?.category || 'PRODUTO'} • {cp.product?.subType?.replace('_', ' ') || 'PADRÃO'}
                  </span>
                </div>
                {renderStatusBadge(cp.status)}
              </div>

              {/* Product Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div>
                  <span className="label-sm" style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
                    Valor Pago:
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                    {formatPrice(cp.pricePaid)}
                  </span>
                </div>
                <div>
                  <span className="label-sm" style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
                    Data da Compra:
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {formatDate(cp.startDate)}
                  </span>
                </div>
              </div>

              {/* Footer info (Sale Channel) */}
              {cp.saleChannel && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', borderTop: '1px dotted var(--border)', paddingTop: 8, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>🛒 Origem:</span>
                  <strong style={{ color: 'var(--text-secondary)' }}>{cp.saleChannel.replace('_', ' ')}</strong>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
