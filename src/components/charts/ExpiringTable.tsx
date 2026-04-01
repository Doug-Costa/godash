'use client';

import { useState } from 'react';

interface ExpiringRow {
  fullName: string;
  email: string;
  planTitle: string;
  expiresIn: string;
  daysLeft: number;
}

interface ExpiringTableProps {
  data: ExpiringRow[];
}

const PAGE_SIZE = 10;

export default function ExpiringTable({ data }: ExpiringTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paginated = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const getDaysBadge = (days: number) => {
    if (days < 7) return 'badge badge-down';
    if (days <= 14) return 'badge badge-warn';
    return 'badge badge-up';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="card animate-fadeUp" style={{ animationDelay: '500ms' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Assinaturas Expirando</div>
          <div className="label-sm">{data.length} assinantes próximos do vencimento</div>
        </div>
        <span className="badge badge-cyan">{data.length} total</span>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Plano</th>
              <th>Vencimento</th>
              <th style={{ textAlign: 'center' }}>Dias Restantes</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
                  Nenhuma assinatura expirando no período
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={`${row.email}-${i}`}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.fullName}</td>
                  <td><span className="stat-mono" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{row.email}</span></td>
                  <td>{row.planTitle}</td>
                  <td><span className="stat-mono" style={{ fontSize: 12 }}>{formatDate(row.expiresIn)}</span></td>
                  <td style={{ textAlign: 'center' }}><span className={getDaysBadge(Number(row.daysLeft))}>{row.daysLeft}d</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--surface-raised)' }}>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface-raised)', cursor: page === 0 ? 'not-allowed' : 'pointer',
              color: page === 0 ? 'var(--text-faint)' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 500, transition: 'all 0.2s',
            }}
          >
            ← Anterior
          </button>
          <span className="stat-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface-raised)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              color: page >= totalPages - 1 ? 'var(--text-faint)' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 500, transition: 'all 0.2s',
            }}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
