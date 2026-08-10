import prisma from '../prisma';

export interface RoutingConfig {
  routingMode: string;         // "ROUND_ROBIN" | "POOL"
  useAccountManager: boolean;
  strictSkillMatch: boolean;
  productId?: string | null;
}

export class RoutingEngineService {
  /**
   * Determina o ID do operador a ser atribuído com base na cascata de roteamento inteligente.
   * Retorna `null` se a campanha estiver em modo POOL ou se nenhum operador estiver disponível.
   */
  async determineAssignee(
    customerIdOrExternalId: string | number,
    config: RoutingConfig,
    targetRole: 'AGENT' | 'POST_SALES',
    index?: number,
    candidateUserIds?: string[]
  ): Promise<string | null> {
    const { routingMode, useAccountManager, strictSkillMatch, productId } = config;

    // 1. Modo POOL (Fila de Órfãos Estratégica)
    if (routingMode === 'POOL') {
      console.log(`[RoutingEngine] Lead ${customerIdOrExternalId} está em modo POOL. Retornando null (órfão).`);
      return null;
    }

    // 2. Verificação de Account Manager (Intimidade/Histórico)
    if (useAccountManager) {
      console.log(`[RoutingEngine] Verificando Account Manager para o lead ${customerIdOrExternalId}...`);
      
      // Buscar última oportunidade ativa/concluída do lead que possui operador ativo com a role correta
      const lastOp = await prisma.opportunity.findFirst({
        where: {
          customer: typeof customerIdOrExternalId === 'number'
            ? { externalPersonId: customerIdOrExternalId }
            : { id: customerIdOrExternalId },
          assigneeId: { not: null },
          assignee: {
            isActive: true,
            role: targetRole
          }
        },
        orderBy: { updatedAt: 'desc' },
        select: { assigneeId: true }
      });

      if (lastOp?.assigneeId) {
        console.log(`[RoutingEngine] Account Manager encontrado na Opportunity anterior: ${lastOp.assigneeId}`);
        return lastOp.assigneeId;
      }

      // Fallback: verificar se o registro do Customer possui um operador atribuído
      const customerRecord = await prisma.customer.findFirst({
        where: typeof customerIdOrExternalId === 'number'
          ? {
              externalPersonId: customerIdOrExternalId,
              assigneeId: { not: null },
              assignee: {
                isActive: true,
                role: targetRole
              }
            }
          : {
              id: customerIdOrExternalId,
              assigneeId: { not: null },
              assignee: {
                isActive: true,
                role: targetRole
              }
            },
        select: { assigneeId: true }
      });

      if (customerRecord?.assigneeId) {
        console.log(`[RoutingEngine] Account Manager encontrado no Customer: ${customerRecord.assigneeId}`);
        return customerRecord.assigneeId;
      }
    }

    // 3. Verificação de Especialista (Skill Match)
    let candidates = await prisma.user.findMany({
      where: {
        isActive: true,
        role: targetRole,
        ...(candidateUserIds && candidateUserIds.length > 0 ? { id: { in: candidateUserIds } } : {})
      },
      select: { id: true, skills: true }
    });

    if (strictSkillMatch && productId) {
      console.log(`[RoutingEngine] Aplicando strictSkillMatch para o produto: ${productId}`);
      
      const specialists = candidates.filter(user => 
        user.skills && Array.isArray(user.skills) && user.skills.includes(productId)
      );

      if (specialists.length > 0) {
        console.log(`[RoutingEngine] Encontrados ${specialists.length} especialistas para o produto ${productId}`);
        candidates = specialists;
      } else {
        // Trava de segurança: se nenhum especialista estiver disponível, ignorar skill e trazer todos ativos
        console.warn(`[RoutingEngine] Nenhum especialista ativo encontrado. Fazendo fallback para toda a equipe ativa.`);
      }
    }

    if (candidates.length === 0) {
      console.warn(`[RoutingEngine] Nenhum operador ativo do papel ${targetRole} disponível.`);
      return null;
    }

    // 4. Roteamento Final (Round Robin / Load Balancing)
    const selectedId = await this.applyRoundRobin(candidates, index);
    console.log(`[RoutingEngine] Operador atribuído: ${selectedId}`);
    return selectedId;
  }

  /**
   * Aplica o algoritmo de distribuição circular.
   * Se for passado um índice (lote de importação), faz a divisão direta.
   * Caso contrário, faz o balanceamento dinâmico pelo operador menos sobrecarregado (com menos oportunidades abertas).
   */
  private async applyRoundRobin(operators: { id: string }[], index?: number): Promise<string> {
    if (operators.length === 0) {
      throw new Error('[RoutingEngine] Lista de operadores vazia no Round Robin');
    }

    if (typeof index === 'number') {
      return operators[index % operators.length].id;
    }

    // Balanceamento dinâmico: quem tem menos oportunidades abertas atualmente
    const opIds = operators.map(o => o.id);
    const counts = await prisma.opportunity.groupBy({
      by: ['assigneeId'],
      where: {
        assigneeId: { in: opIds },
        status: 'OPEN'
      },
      _count: {
        id: true
      }
    });

    const countMap = new Map<string, number>();
    for (const id of opIds) {
      countMap.set(id, 0);
    }
    for (const c of counts) {
      if (c.assigneeId) {
        countMap.set(c.assigneeId, c._count.id);
      }
    }

    let minId = opIds[0];
    let minCount = countMap.get(minId)!;

    for (const id of opIds) {
      const cnt = countMap.get(id)!;
      if (cnt < minCount) {
        minCount = cnt;
        minId = id;
      }
    }

    return minId;
  }
}
