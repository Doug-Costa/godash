import React from 'react';

interface RevenueChartProps {
  data: Array<{
    period: string; // Changed from 'month' to 'period' for consistency
    mrr: number;
    sales: number;
    revenue: number;
  }>;
  month?: string;
  totalSalesCount?: number;
  totalYield?: number;
  totalSalesValue?: number;
}



const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatPeriod = (periodStr: string) => {
  if (!periodStr) return '';
  // Check if it's YYYY-MM-DD (Daily) or YYYY-MM (Monthly)
  const parts = periodStr.split('-');
  if (parts.length === 3) {
    // Daily: 2024-03-31 -> 31/03
    return `${parts[2]}/${parts[1]}`;
  } else if (parts.length === 2) {
    // Monthly: 2024-03 -> 03/24
    return `${parts[1]}/${parts[0].slice(2)}`;
  }
  return periodStr;
};

export default function RevenueChart({ data, month, totalSalesCount, totalYield, totalSalesValue }: RevenueChartProps) {
  const maxVal = Math.max(...data.map(d => Number(d.revenue) || 0), 10000);

  const totalSalesFromBars = data.reduce((sum, d) => sum + Number(d.sales), 0);
  
  // Fix for Timezone: Add T12:00:00 to month string
  const monthLabel = month ? new Date(month + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Meses Anteriores';



  return (
    <div className="card animate-fadeUp" style={{ animationDelay: '200ms', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="label" style={{ marginBottom: 4, color: 'var(--accent)' }}>Receita: {monthLabel}</div>
          <div className="label-sm">Foco no faturamento mensal "até o momento"</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div className="label-sm" style={{ color: 'var(--accent)' }}>Yield (Core)</div>
              <div className="stat-mono" style={{ fontSize: 14 }}>{formatBRL(totalYield || 0)}</div>
            </div>
            <div>
              <div className="label-sm" style={{ color: 'var(--purple)' }}>Vendas Avulsas</div>
              <div className="stat-mono" style={{ fontSize: 14 }}>{totalSalesCount || 0} vend. · {formatBRL(totalSalesValue || totalSalesFromBars)}</div>
            </div>
          </div>
        </div>
      </div>



      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '4px', height: 220, overflowX: 'auto' }}>
        {data.map((d, i) => {
          const mrr = Number(d.mrr) || 0;
          const sales = Number(d.sales) || 0;
          const mrrHeight = (mrr / maxVal) * 100;
          const salesHeight = (sales / maxVal) * 100;

          return (
            <div key={i} style={{ flex: 1, minWidth: data.length > 15 ? '20px' : '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div 
                className="chart-bar-container"
                title={`${formatPeriod(d.period)}\nMRR: ${formatBRL(mrr)}\nVendas: ${formatBRL(sales)}\nTotal: ${formatBRL(mrr + sales)}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'flex-end',
                  cursor: 'pointer'
                }}
              >
                {sales > 0 && (
                  <div style={{ 
                    height: `${salesHeight}%`, 
                    width: '100%', 
                    background: 'var(--purple)',
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    borderBottomLeftRadius: mrr === 0 ? 4 : 0,
                    borderBottomRightRadius: mrr === 0 ? 4 : 0,
                    transition: 'all 0.3s'
                  }} className="hover-glow" />
                )}
                {mrr > 0 && (
                  <div style={{ 
                    height: `${mrrHeight}%`, 
                    width: '100%', 
                    background: 'var(--accent)',
                    borderTopLeftRadius: sales === 0 ? 4 : 0,
                    borderTopRightRadius: sales === 0 ? 4 : 0,
                    borderBottomLeftRadius: 4,
                    borderBottomRightRadius: 4,
                    transition: 'all 0.3s'
                  }} className="hover-glow" />
                )}
              </div>
              <span className="stat-mono" style={{ fontSize: 9, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                {formatPeriod(d.period)}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)' }}/>
          <span className="label-sm">MRR Core</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--purple)' }}/>
          <span className="label-sm">Vendas Avulsas</span>
        </div>
      </div>
    </div>
  );
}
