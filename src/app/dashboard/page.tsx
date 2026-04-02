import DashboardContent from './DashboardContent';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function fetchData(endpoint: string, params?: Record<string, string>) {
  try {
    const url = new URL(`/api/${endpoint}`, BASE_URL);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      console.error(`❌ Fetch Failed in Docker: ${endpoint} (Status: ${res.status} URL: ${url.toString()})`);
      return null;
    }
    const json = await res.json();
    return json.data ?? null;
  } catch (error: any) {
    console.error(`❌ Fetch Error in Docker: ${endpoint} (${error.message})`);
    return null;
  }
}

interface SearchParams {
  period?: string;
  month?: string;
}


export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const period = resolvedParams?.period || '12m';
  const month = resolvedParams?.month || new Date().toISOString().slice(0, 7); // Default to current YYYY-MM


  const [kpis, revenue, users, churn, subscriptions] = await Promise.all([
    fetchData('kpis', { month }),
    fetchData('revenue', { period, month }),
    fetchData('users', { month }),
    fetchData('churn', { months: period.replace('m', '') }), // Churn uses months count
    fetchData('subscriptions', { days: '30' }),
  ]);


  return (
    <DashboardContent
      kpis={kpis}
      revenue={revenue}
      users={users}
      churn={churn}
      subscriptions={subscriptions}
      period={period}
      month={month}
    />

  );
}
