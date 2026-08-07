import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import FlowManagerContent from '@/components/FlowManagerContent';
import prisma from '@/lib/prisma';

export default async function FlowManagerPage() {
  // 1. Resolve a sessão no servidor
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // 2. Extrai dados do usuário logado
  const currentUser = {
    id: (session.user as any).id,
    name: session.user.name || 'Agente',
    email: session.user.email || '',
    role: (session.user as any).role || 'AGENT',
  };

  // 3. Valida se o perfil logado tem acesso ao motor de fluxos (apenas ADMIN ou POST_SALES)
  const hasAccess = currentUser.role === 'ADMIN' || currentUser.role === 'POST_SALES';

  if (!hasAccess) {
    redirect('/dashboard');
  }

  // 4. Buscar pipelines
  let pipelines: any[] = [];
  try {
    const rawPipelines = await prisma.pipeline.findMany({
      orderBy: { createdAt: 'asc' }
    });
    pipelines = rawPipelines.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description
    }));
  } catch (err: any) {
    console.error('Error fetching pipelines:', err.message);
  }

  // 5. Buscar produtos
  let products: any[] = [];
  try {
    const rawProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    products = rawProducts.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description
    }));
  } catch (err: any) {
    console.error('Error fetching products:', err.message);
  }

  return (
    <FlowManagerContent currentUser={currentUser} initialPipelines={pipelines} initialProducts={products} />
  );
}
