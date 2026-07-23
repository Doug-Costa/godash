'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface GrowthTrendChartProps {
  data: Array<{
    period: string;
    new_growth: number;
    renewals: number;
    churn_events: number;
  }>;
  month?: string;
}

const formatPeriod = (periodStr: string) => {
  if (!periodStr) return '';
  const parts = periodStr.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : periodStr;
};

export default function GrowthTrendChart({ data, month }: GrowthTrendChartProps) {
  const monthLabel = month && month !== 'all'
    ? new Date(month + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : 'Histórico Completo';

  return (
    <div className="card animate-fadeUp" style={{ animationDelay: '200ms', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 24 }}>
        <div className="label" style={{ color: 'var(--text-primary)', marginBottom: 4 }}>
          Tendência de Crescimento: {monthLabel}
        </div>
        <p className="label-sm">Aquisição (Novo/Retorno) vs. Churn</p>
      </div>

      <div style={{ flex: 1, width: '100%', minHeight: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRenewal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--purple)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--red)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--red)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis 
              dataKey="period" 
              tickFormatter={formatPeriod} 
              tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'var(--surface)', 
                border: '1px solid var(--border)', 
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)'
              }}
              itemStyle={{ padding: '2px 0' }}
              labelFormatter={(label) => `Dia: ${formatPeriod(label)}`}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 12, paddingBottom: 20 }} />
            
            {/* Stacked Growth */}
            <Area 
              type="monotone" 
              dataKey="new_growth" 
              name="Novas Aquisições"
              stackId="1"
              stroke="var(--accent)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorNew)" 
              animationDuration={1500}
            />
            <Area 
              type="monotone" 
              dataKey="renewals" 
              name="Retorno (Comercial)"
              stackId="1"
              stroke="var(--purple)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRenewal)" 
              animationDuration={1500}
            />

            {/* Non-stacked Churn for comparison */}
            <Area 
              type="monotone" 
              dataKey="churn_events" 
              name="Cancelados"
              stroke="var(--red)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorChurn)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
