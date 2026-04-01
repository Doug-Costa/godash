'use client';

import { useEffect, useRef } from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  accent?: 'cyan' | 'green' | 'yellow' | 'red' | 'purple';
  delay?: number;
}

const accentColors: Record<string, { border: string; text: string }> = {
  cyan:   { border: 'var(--accent)',  text: 'var(--accent)' },
  green:  { border: 'var(--green)',   text: 'var(--green)' },
  yellow: { border: 'var(--yellow)',  text: 'var(--yellow)' },
  red:    { border: 'var(--red)',     text: 'var(--red)' },
  purple: { border: 'var(--purple)',  text: 'var(--purple)' },
};

export default function KpiCard({ title, value, subtitle, trend, accent = 'cyan', delay = 0 }: KpiCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const colors = accentColors[accent];

  useEffect(() => {
    const el = cardRef.current;
    if (el) {
      el.style.animationDelay = `${delay}ms`;
    }
  }, [delay]);

  const trendBadge = trend ? (
    <span className={`badge ${trend.value > 0 ? 'badge-up' : trend.value < 0 ? 'badge-down' : 'badge-neu'}`}>
      {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→'}
      {' '}{Math.abs(trend.value).toFixed(1)}%
      <span style={{ marginLeft: 4, opacity: 0.7 }}>{trend.label}</span>
    </span>
  ) : null;

  return (
    <div
      ref={cardRef}
      className="card-glow animate-fadeUp"
      style={{ borderLeft: `3px solid ${colors.border}`, minWidth: 0 }}
    >
      <div className="label" style={{ marginBottom: 12 }}>{title}</div>
      <div className="stat-value" style={{ color: colors.text, marginBottom: 8 }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {trendBadge}
        {subtitle && <span className="label-sm">{subtitle}</span>}
      </div>
    </div>
  );
}
