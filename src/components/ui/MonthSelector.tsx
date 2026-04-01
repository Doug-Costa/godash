'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface MonthSelectorProps {
  currentMonth: string; // YYYY-MM
}

export default function MonthSelector({ currentMonth }: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [year, month] = currentMonth.split('-');
  
  const years = [2026, 2025, 2024, 2023, 2022, 2021];
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
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', `${newYear}-${newMonth}`);
    params.delete('period'); // Remove period if month is selected
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select
        value={year}
        onChange={(e) => handleUpdate(e.target.value, month)}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      <select
        value={month}
        onChange={(e) => handleUpdate(year, e.target.value)}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
      </select>
    </div>
  );
}
