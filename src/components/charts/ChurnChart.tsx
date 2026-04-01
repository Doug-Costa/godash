'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ChurnDataPoint {
  month: string;
  canceled: number;
  churnRate: number;
}

interface ChurnChartProps {
  data: ChurnDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface-raised)',
      border: '1px solid var(--border-hover)',
      borderRadius: 12,
      padding: '12px 16px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div className="label-sm" style={{ marginBottom: 8 }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
          <span className="stat-mono" style={{ color: entry.color, fontSize: '0.875rem' }}>
            {entry.dataKey === 'churnRate' ? `${entry.value.toFixed(2)}%` : `${entry.value} cancel.`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function ChurnChart({ data }: ChurnChartProps) {
  return (
    <div className="card animate-fadeUp" style={{ animationDelay: '300ms' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 4 }}>Churn Mensal</div>
        <div className="label-sm">Cancelamentos + Taxa de churn</div>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontFamily: 'var(--font-body)', fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="canceled" name="Cancelamentos" fill="var(--red)" radius={[6, 6, 0, 0]} maxBarSize={32} opacity={0.8} />
            <Line yAxisId="right" type="monotone" dataKey="churnRate" name="Churn Rate %" stroke="var(--yellow)" strokeWidth={2.5}
              dot={{ r: 4, fill: 'var(--yellow)', stroke: 'var(--surface)', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
