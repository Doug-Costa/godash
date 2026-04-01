'use client';

interface CohortRow {
  cohort: string;
  registered: number;
  stillActive: number;
  withPurchase: number;
}

interface CohortTableProps {
  data: CohortRow[];
}

export default function CohortTable({ data }: CohortTableProps) {
  return (
    <div className="card animate-fadeUp" style={{ animationDelay: '400ms' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 4 }}>Coorte de Retenção</div>
        <div className="label-sm">Cadastrados × Ativos × Com compra por mês</div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Coorte</th>
              <th style={{ textAlign: 'right' }}>Cadastrados</th>
              <th style={{ textAlign: 'right' }}>Ativos</th>
              <th style={{ textAlign: 'right' }}>Com Compra</th>
              <th style={{ textAlign: 'right', minWidth: 180 }}>Retenção</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
                  Nenhum dado de coorte disponível
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const registered = Number(row.registered) || 0;
                const stillActive = Number(row.stillActive) || 0;
                const retention = registered > 0 ? Math.round((stillActive / registered) * 10000) / 100 : 0;

                let barColor = 'var(--red)';
                let badgeClass = 'badge badge-down';
                if (retention >= 60) {
                  barColor = 'var(--green)';
                  badgeClass = 'badge badge-up';
                } else if (retention >= 30) {
                  barColor = 'var(--yellow)';
                  badgeClass = 'badge badge-warn';
                }

                return (
                  <tr key={row.cohort}>
                    <td><span className="stat-mono" style={{ fontSize: 13, color: 'var(--accent)' }}>{row.cohort}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="stat-mono" style={{ fontSize: 13 }}>{registered}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="stat-mono" style={{ fontSize: 13 }}>{stillActive}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="stat-mono" style={{ fontSize: 13 }}>{Number(row.withPurchase) || 0}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                        <div style={{ width: 80, flexShrink: 0 }}>
                          <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: `${Math.min(retention, 100)}%`, background: barColor }} />
                          </div>
                        </div>
                        <span className={badgeClass} style={{ minWidth: 60, justifyContent: 'center' }}>{retention.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
