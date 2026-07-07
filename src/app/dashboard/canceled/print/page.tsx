'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

interface SearchParams {
  month?: string;
  plan?: string;
  search?: string;
}

interface CanceledLead {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  canceledAt?: string;
  createdAt?: string;
  plan?: {
    id: number;
    title: string;
    price: number;
    interval: string;
  } | null;
  stage: string;
  tag?: string | null;
  assignee?: {
    id: string;
    name: string;
  } | null;
}

export default function CanceledPrintPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const router = useRouter();
  const resolvedParams = use(searchParams);
  const month = resolvedParams.month || '';
  const plan = resolvedParams.plan || '';
  const search = resolvedParams.search || '';

  const [data, setData] = useState<CanceledLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = `/api/leads/canceled?page=1&limit=10000&month=${month}`;
        if (plan && plan !== 'all') url += `&plan=${plan}`;
        if (search.trim() !== '') url += `&search=${encodeURIComponent(search)}`;

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
        } else {
          if (res.status === 403) {
            setError('Acesso negado. Apenas administradores podem ver este relatório.');
          } else {
            setError('Erro ao carregar dados do relatório.');
          }
        }
      } catch (err) {
        console.error('Error fetching print data:', err);
        setError('Erro de rede ao carregar o relatório.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month, plan, search]);

  useEffect(() => {
    if (!loading && data.length > 0 && !error) {
      // Trigger native print dialog after rendering completes
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, data, error]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff', color: '#333', fontFamily: 'sans-serif' }}>
        <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #7c3aed', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite', marginBottom: 16 }}></div>
        <p>Preparando relatório de cancelados...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif', background: '#fff', color: '#ef4444' }}>
        <h2>Erro</h2>
        <p>{error}</p>
        <button onClick={() => router.back()} style={{ marginTop: 20, padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', background: '#fff', color: '#000', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
            color: #000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f3f4f6;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
      `}</style>

      {/* Header and Print action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #333', paddingBottom: 20, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#111' }}>DentalGO</h1>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: '5px 0 0 0', color: '#4b5563' }}>Relatório de Clientes Cancelados (Churn)</h2>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 10 }}>
            <span>Competência: {month || 'Geral'}</span>
            {plan && plan !== 'all' && <span style={{ marginLeft: 15 }}>Plano ID: {plan}</span>}
            {search && <span style={{ marginLeft: 15 }}>Busca: &quot;{search}&quot;</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button 
            onClick={() => window.print()} 
            className="no-print"
            style={{ padding: '8px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', marginRight: 8 }}
          >
            🖨️ Imprimir / Salvar PDF
          </button>
          <button 
            onClick={() => window.close()} 
            className="no-print"
            style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
          >
            Fechar Aba
          </button>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 10 }}>
            Gerado em: {new Date().toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 15, fontSize: 13, fontWeight: 600 }}>
        Total de registros encontrados: {data.length}
      </div>

      {data.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', border: '1px dashed #ccc', borderRadius: 8 }}>
          Nenhum registro encontrado para os filtros selecionados.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th style={{ width: '4%' }}>#</th>
              <th style={{ width: '13%' }}>Data Cancelamento</th>
              <th>Nome Completo</th>
              <th>Email</th>
              <th style={{ width: '12%' }}>Telefone</th>
              <th>Plano Cancelado</th>
              <th style={{ width: '10%' }}>Valor Plano</th>
              <th style={{ width: '10%' }}>Data Início</th>
              <th style={{ width: '10%' }}>Estágio CRM</th>
              <th style={{ width: '12%' }}>Responsável</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.id}>
                <td>{idx + 1}</td>
                <td>{item.canceledAt ? item.canceledAt.slice(0, 10).split('-').reverse().join('/') : '-'}</td>
                <td style={{ fontWeight: 600 }}>{item.fullName}</td>
                <td>{item.email}</td>
                <td>{item.phoneNumber || 'Sem fone'}</td>
                <td>{item.plan ? item.plan.title : '-'}</td>
                <td>{item.plan ? `R$ ${(item.plan.price / 100).toFixed(2)}` : '-'}</td>
                <td>{item.createdAt ? item.createdAt.slice(0, 10).split('-').reverse().join('/') : '-'}</td>
                <td>
                  <span style={{ textTransform: 'capitalize' }}>
                    {item.stage ? item.stage.replace('_', ' ') : 'Sem Contato'}
                  </span>
                </td>
                <td>{item.assignee ? item.assignee.name : 'Não atribuído'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
