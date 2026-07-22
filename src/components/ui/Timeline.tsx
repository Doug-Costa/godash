import React, { useState } from 'react';

export interface TimelineEvent {
  id: string;
  text: string;
  date: string;
  authorName: string;
  type: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

const TYPE_CONFIGS: Record<string, { label: string; icon: string; bg: string; border: string; color: string }> = {
  CONTACT_ATTEMPT: {
    label: 'Contato Feito',
    icon: '💬',
    bg: 'rgba(192, 132, 252, 0.12)',
    border: 'var(--accent)',
    color: 'var(--text-primary)',
  },
  MEETING_SCHEDULED: {
    label: 'Retorno Agendado',
    icon: '📅',
    bg: 'rgba(96, 165, 250, 0.12)',
    border: '#60A5FA',
    color: 'var(--text-primary)',
  },
  RECOVERED: {
    label: 'Ganho / Recuperado',
    icon: '🤝',
    bg: 'rgba(74, 222, 128, 0.12)',
    border: '#4ADE80',
    color: '#4ADE80',
  },
  LOST: {
    label: 'Perda / Descarte',
    icon: '🚨',
    bg: 'rgba(248, 113, 113, 0.12)',
    border: '#F87171',
    color: '#F87171',
  },
  FREEZE: {
    label: 'Atendimento Congelado',
    icon: '❄️',
    bg: 'rgba(14, 165, 233, 0.12)',
    border: '#0ea5e9',
    color: '#0ea5e9',
  },
  UNFREEZE: {
    label: 'Atendimento Descongelado',
    icon: '☀️',
    bg: 'rgba(234, 179, 8, 0.12)',
    border: '#eab308',
    color: '#eab308',
  },
  SYSTEM_LOG: {
    label: 'Sistema',
    icon: '🤖',
    bg: 'rgba(107, 114, 128, 0.12)',
    border: '#6B7280',
    color: 'var(--text-muted)',
  },
  NOTE: {
    label: 'Anotação',
    icon: '📝',
    bg: 'var(--surface-raised)',
    border: 'var(--border)',
    color: 'var(--text-primary)',
  },
  TASK_COMPLETED: {
    label: 'Compromisso Cumprido',
    icon: '✅',
    bg: 'rgba(34, 197, 94, 0.12)',
    border: '#22c55e',
    color: '#22c55e',
  },
  TASK_CANCELED: {
    label: 'Compromisso Cancelado/Pulado',
    icon: '❌',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: '#ef4444',
    color: '#ef4444',
  },
  CAMPAIGN: {
    label: 'Participação em Campanha',
    icon: '🎯',
    bg: 'rgba(124, 58, 237, 0.12)',
    border: '#7c3aed',
    color: '#7c3aed',
  },
};

export default function Timeline({ events }: TimelineProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  if (!events || events.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)',
        border: '1px dashed var(--border)', borderRadius: 8, fontSize: 13
      }}>
        Nenhuma interacão registrada ainda para este cliente.
      </div>
    );
  }

  // Sorting: newest first
  const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Pagination calculations
  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = sortedEvents.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Timeline container */}
      <div style={{
        position: 'relative',
        paddingLeft: 24,
        borderLeft: '2px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        margin: '8px 0 8px 12px',
      }}>
        {paginatedEvents.map((evt) => {
          const cfg = TYPE_CONFIGS[evt.type] || TYPE_CONFIGS.NOTE;

          return (
            <div key={evt.id} style={{ position: 'relative' }}>
              {/* Bullet node on timeline thread */}
              <div style={{
                position: 'absolute',
                left: -33,
                top: 2,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'var(--surface)',
                border: `2px solid ${cfg.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 1,
              }}>
                {cfg.icon}
              </div>

              {/* Event card */}
              <div style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}20`,
                borderRadius: 12,
                padding: '12px 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'transform 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8, fontSize: 11 }}>
                  <span style={{ fontWeight: 700, color: cfg.border }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    <span>por {evt.authorName}</span>
                    <span>&bull;</span>
                    <span>{formatDate(evt.date)}</span>
                  </div>
                </div>
                <p style={{
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {evt.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn-action"
            style={{
              padding: '6px 12px',
              fontSize: 11,
              borderRadius: 6,
              background: currentPage === 1 ? 'var(--border)' : 'var(--surface-raised)',
              color: currentPage === 1 ? 'var(--text-faint)' : 'var(--text-primary)',
              border: 'none',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            &larr; Anterior
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Página <strong>{currentPage}</strong> de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn-action"
            style={{
              padding: '6px 12px',
              fontSize: 11,
              borderRadius: 6,
              background: currentPage === totalPages ? 'var(--border)' : 'var(--surface-raised)',
              color: currentPage === totalPages ? 'var(--text-faint)' : 'var(--text-primary)',
              border: 'none',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Próximo &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
