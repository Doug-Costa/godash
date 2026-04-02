import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

interface PlanDistributionChartProps {
  data: any[];
  payingUsers: number;
  courtesyUsers: number;
}

const COLORS = {
  'Anual': '#22D3EE',
  'Recorrente': '#C084FC',
  'Produto': '#4ADE80',
  'Institucional': '#FACC15',
  'Cortesia': '#94A3B8'
};

export default function PlanDistributionChart({ data, payingUsers, courtesyUsers }: PlanDistributionChartProps) {
  // Grouping by Board Taxonomy
  const categories = {
    'Anual': 0,
    'Recorrente': 0,
    'Produto': 0,
    'Institucional': 0,
    'Cortesia': 0
  };

  data.forEach(p => {
    const title = (p.planTitle || '').toLowerCase();
    if (title.includes('scholar') || title.includes('mandic') || title.includes('ioa') || title.includes('sbti') || title.includes('sobrap') || title.includes('sociedade') || title.includes('universidade') || title.includes('grupo')) {
      categories['Institucional'] += p.subscriberCount;
    } else if (title.includes('cortesia') || title.includes('teste') || title.includes('degustação')) {
      categories['Cortesia'] += p.subscriberCount;
    } else if (title.includes('livro') || title.includes('ebook')) {
      categories['Produto'] += p.subscriberCount;
    } else if (title.includes('anual')) {
      categories['Anual'] += p.subscriberCount;
    } else {
      categories['Recorrente'] += p.subscriberCount;
    }
  });

  const chartData = Object.entries(categories)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="card animate-fadeUp" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="label">Distribuição Estratégica (Pizza)</div>
        <p className="label-sm">Segmentação por Taxonomia de Diretoria</p>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={1000}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8 }}
              itemStyle={{ color: 'var(--text-primary)', fontSize: 12 }}
            />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div>
          <div className="label-sm">Total Core</div>
          <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.25rem' }}>{payingUsers}</div>
        </div>
        <div>
          <div className="label-sm">Total Taxonomia</div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1.25rem' }}>
            {Object.values(categories).reduce((a, b) => a + b, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
