import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import FormsConfiguratorContent from '@/components/FormsConfiguratorContent';

export default async function FormsConfiguratorPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  const currentUser = {
    id: (session.user as any).id,
    name: session.user.name || 'Agente',
    email: session.user.email || '',
    role: (session.user as any).role || 'AGENT',
  };

  if (currentUser.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch Pipelines, Campaigns, and Products to bind to forms
  const [pipelines, campaigns, products] = await Promise.all([
    prisma.pipeline.findMany({ orderBy: { name: 'asc' } }),
    prisma.campaign.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  ]);

  return (
    <FormsConfiguratorContent 
      currentUser={currentUser} 
      pipelines={pipelines.map(p => ({ id: p.id, name: p.name }))}
      campaigns={campaigns.map(c => ({ id: c.id, name: c.name }))}
      products={products.map(p => ({ id: p.id, name: p.name }))}
    />
  );
}
