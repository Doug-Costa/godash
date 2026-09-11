'use client';

interface MonthSelectorProps {
  currentMonth: string; // YYYY-MM or 'all'
  allowAll?: boolean;
  onChange?: (month: string) => void;
}

export default function MonthSelector({ currentMonth, allowAll = true, onChange }: MonthSelectorProps) {
  const isAll = allowAll && currentMonth === 'all';
  const defaultMonthStr = new Date().toISOString().slice(0, 7);
  const activeMonthStr = isAll ? defaultMonthStr : currentMonth;
  const [year, month] = activeMonthStr.split('-');
  
  // Dynamic years: Current year and previous 4 years
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  const months = [
    { v: '01', l: 'Janeiro' },
    { v: '02', l: 'Fevereiro' },
    { v: '03', l: 'Março' },
    { v: '04', l: 'Abril' },
    { v: '05', l: 'Maio' },
    { v: '06', l: 'Junho' },
    { v: '07', l: 'Julho' },
    { v: '08', l: 'Agosto' },
    { v: '09', l: 'Setembro' },
    { v: '10', l: 'Outubro' },
    { v: '11', l: 'Novembro' },
    { v: '12', l: 'Dezembro' },
  ];

  const handleUpdate = (newYear: string, newMonth: string) => {
    if (onChange) onChange(`${newYear}-${newMonth}`);
  };

  const handleToggleAll = () => {
    if (!onChange) return;
    if (isAll) {
      // Destravar: passar para o mês específico selecionado nos selects
      onChange(`${year}-${month}`);
    } else {
      // Ativar Todos os Meses
      onChange('all');
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {allowAll && (
        <button
          type="button"
          onClick={handleToggleAll}
          title={isAll ? 'Filtro Todos os Meses ativo. Clique para destravar e filtrar pelo mês selecionado.' : 'Clique para ver todos os meses'}
          style={{
            background: isAll ? 'var(--accent)' : 'var(--surface)',
            border: isAll ? '1px solid var(--accent)' : '1px solid var(--border)',
            color: isAll ? '#fff' : 'var(--text-secondary)',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>📅 Todos os Meses</span>
          {isAll && (
            <span style={{ fontSize: 10, opacity: 0.9, background: 'rgba(0,0,0,0.2)', padding: '1px 5px', borderRadius: 4 }}>
              Destravar ✕
            </span>
          )}
        </button>
      )}

      <div style={{ display: 'flex', gap: 4, opacity: isAll ? 0.85 : 1, alignItems: 'center' }}>
        <select
          value={year}
          onChange={(e) => handleUpdate(e.target.value, month)}
          title="Selecione o ano da competência"
          style={{
            background: 'var(--surface)',
            border: isAll ? '1px dashed var(--accent)' : '1px solid var(--border)',
            color: 'var(--text-primary)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s'
          }}
        >
          {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
        </select>

        <select
          value={month}
          onChange={(e) => handleUpdate(year, e.target.value)}
          title="Selecione o mês da competência"
          style={{
            background: 'var(--surface)',
            border: isAll ? '1px dashed var(--accent)' : '1px solid var(--border)',
            color: 'var(--text-primary)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s'
          }}
        >
          {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
      </div>

      {allowAll && (
        <button
          type="button"
          onClick={handleToggleAll}
          style={{
            background: 'transparent',
            border: 'none',
            color: isAll ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 12,
            cursor: 'pointer',
            padding: '4px 8px',
            textDecoration: 'underline',
            fontWeight: isAll ? 600 : 400
          }}
        >
          {isAll ? 'Destravar Mês' : 'Ver Todos os Meses'}
        </button>
      )}
    </div>
  );
}
