'use client';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

interface PlanData {
  planId: number;
  planTitle: string;
  intervalType: string;
  isManualPayment: number;
  price: number;
  subscriberCount: number;
}

interface PlanDistributionChartProps {
  data: PlanData[];
  payingUsers: number;
  courtesyUsers: number;
}

const COLORS = [
  '#22D3EE', '#C084FC', '#4ADE80', '#FACC15',
  '#F87171', '#FB923C', '#818CF8', '#2DD4BF',
  '#E879F9', '#A78BFA',
];

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: PlanData & { fill: string } }> }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'var(--surface-raised)',
      border: '1px solid var(--border-hover)',
      borderRadius: 12,
      padding: '12px 16px',
      boxShadow: 'var(--shadow-card)',
      maxWidth: 240,
    }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, fontSize: 13 }}>{d.planTitle || 'Sem nome'}</div>
      <div className="label-sm" style={{ marginBottom: 2 }}>
        {d.subscriberCount} assinantes · {formatBRL(d.price)}/{d.intervalType === 'months' ? 'mês' : 'dia'}
      </div>
      {d.isManualPayment === 1 && (
        <span className="badge badge-warn" style={{ marginTop: 4 }}>Cortesia</span>
      )}
    </div>
  );
};

export default function PlanDistributionChart({ data, payingUsers, courtesyUsers }: PlanDistributionChartProps) {
  const total = data.reduce((sum, d) => sum + Number(d.subscriberCount), 0);

  return (
    <div className="card animate-fadeUp" style={{ animationDelay: '250ms' }}>
      <div style={{ marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 4 }}>Distribuição por Plano</div>
        <div className="label-sm">{total} assinantes ativos</div>
      </div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="subscriberCount" stroke="none">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {data.slice(0, 6).map((d, i) => (
          <div key={d.planId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
              <span className="label-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.planTitle || `Plano #${d.planId}`}
              </span>
            </div>
            <span className="stat-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>{d.subscriberCount}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <div>
          <div className="label-sm">Pagantes</div>
          <div className="stat-mono" style={{ color: 'var(--green)', fontSize: 18 }}>{payingUsers}</div>
        </div>
        <div>
          <div className="label-sm">Cortesia</div>
          <div className="stat-mono" style={{ color: 'var(--yellow)', fontSize: 18 }}>{courtesyUsers}</div>
        </div>
      </div>
    </div>
  );
}
