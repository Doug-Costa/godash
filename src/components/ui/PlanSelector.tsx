'use client';

import React from 'react';

interface PlanSelectorProps {
  selectedPlan: string;
}

export default function PlanSelector({ selectedPlan }: PlanSelectorProps) {
  return (
    <select 
      value={selectedPlan}
      onChange={(e) => {
        const url = new URL(window.location.href);
        url.searchParams.set('plan', e.target.value);
        window.location.href = url.toString();
      }}
      style={{
        appearance: 'none',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '6px 32px 6px 16px',
        color: 'var(--text-primary)',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23888%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px top 50%',
        backgroundSize: '10px auto',
      }}
    >
      <option value="all">Todos os Planos</option>
      <option value="core">Somente Core (Pagantes Reais)</option>
      <option value="institutional">Somente Institucionais</option>
      {/* Individual specific plans could be loaded here dynamically */}
    </select>
  );
}
