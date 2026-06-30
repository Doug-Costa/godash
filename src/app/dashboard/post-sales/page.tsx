import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import PostSalesContent from '@/components/PostSalesContent';

export default async function PostSalesPage() {
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

  // 3. Valida se o perfil logado tem acesso ao pós-venda (apenas ADMIN ou POST_SALES)
  const hasAccess = currentUser.role === 'ADMIN' || currentUser.role === 'POST_SALES';

  if (!hasAccess) {
    redirect('/dashboard');
  }

  return (
    <PostSalesContent currentUser={currentUser} />
  );
}
