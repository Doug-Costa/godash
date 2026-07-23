import DashboardContent from './DashboardContent';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

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
  const month = resolvedParams?.month || 'all';

  // 1. Resolve Session and Role
  const session = await auth();
  const currentUser = session?.user ? {
    id: (session.user as any).id,
    name: session.user.name || 'Agente',
    email: session.user.email || '',
    role: (session.user as any).role || 'AGENT',
  } : null;

  const isAdmin = currentUser?.role === 'ADMIN';

  // 2. Conditional data fetching based on role
  let kpis = null;
  let revenue = null;
  let users = null;
  let churn = null;
  let subscriptions = null;

  if (isAdmin) {
    // Admin fetches everything
    [kpis, revenue, users, churn, subscriptions] = await Promise.all([
      fetchData('kpis', { month }),
      fetchData('revenue', { period, month }),
      fetchData('users', { month }),
      fetchData('churn', { months: period.replace('m', '') }),
      fetchData('subscriptions', { days: '30' }),
    ]);
  } else {
    // Agent only fetches the users (leads) core info
    users = await fetchData('users', { month });
  }

  // 3. Fetch agents list from Database and format nullable properties
  let agents: any[] = [];
  try {
    const rawAgents = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    agents = rawAgents.map(a => ({
      id: a.id,
      name: a.name || 'Agente',
      email: a.email || '',
      role: a.role,
      isActive: a.isActive
    }));
  } catch (err: any) {
    console.error('❌ Error fetching agents in DashboardPage:', err.message);
  }

  // 4. Fetch pipelines from Database
  let pipelines: any[] = [];
  try {
    const rawPipelines = await prisma.pipeline.findMany({
      orderBy: { name: 'asc' }
    });

    pipelines = rawPipelines.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description
    }));
  } catch (err: any) {
    console.error('❌ Error fetching pipelines in DashboardPage:', err.message);
  }

  return (
    <DashboardContent
      kpis={kpis}
      revenue={revenue}
      users={users}
      churn={churn}
      subscriptions={subscriptions}
      period={period}
      month={month}
      currentUser={currentUser}
      agents={agents}
      pipelines={pipelines}
    />
  );
}


