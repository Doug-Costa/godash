/**
 * Regra única de "assinatura atual" de uma pessoa no MySQL legado do DentalGO.
 *
 * Por que existe: uma pessoa pode ter várias linhas em `subscriptions` (tentativa
 * recusada, plano anual expirado, renovação recorrente...). Juntar `people` com
 * todas elas e pegar "a primeira linha" fazia cliente ativo aparecer como
 * ex-cliente, e entrar em filas de reconquista.
 *
 * Regras de negócio (confirmadas com o time):
 *  - `status = 'active'` com vigência vencida é EXPIRADA. O core do DentalGO só
 *    atualiza o status quando o usuário faz login, então o campo fica desatualizado;
 *    a vigência (COALESCE(isValidUntil, expiresIn)) é a fonte de verdade.
 *  - Quem foi cliente, saiu e voltou é CLIENTE: vale a assinatura vigente e as
 *    anteriores são apenas histórico.
 *  - `pending` é tentativa não paga e não conta como assinatura.
 *
 * Assinatura atual = a vigente mais recente; sem nenhuma vigente, a mais recente.
 *
 * Todas as consultas usam o alias `p` para `people` e `s` para a assinatura atual.
 */

/** Data de fim da vigência da assinatura. */
export const subscriptionValidUntilSql = (alias: string) =>
  `COALESCE(${alias}.isValidUntil, ${alias}.expiresIn)`;

/** Verdadeiro quando a assinatura está ativa E dentro da vigência (sem data de fim = vigente). */
export const isEffectivelyActiveSql = (alias: string) =>
  `(${alias}.status = 'active' AND (${subscriptionValidUntilSql(alias)} IS NULL OR ${subscriptionValidUntilSql(alias)} >= CURDATE()))`;

/** Verdadeiro quando a assinatura está expirada, inclusive 'active' com vigência vencida. */
export const isEffectivelyExpiredSql = (alias: string) =>
  `(${alias}.status = 'expired' OR (${alias}.status = 'active' AND ${subscriptionValidUntilSql(alias)} < CURDATE()))`;

/** Status real da assinatura: 'active' | 'expired' | 'canceled' | (demais status como estão no banco). */
export const effectiveStatusSql = (alias: string) =>
  `CASE WHEN ${isEffectivelyActiveSql(alias)} THEN 'active' WHEN ${isEffectivelyExpiredSql(alias)} THEN 'expired' ELSE ${alias}.status END`;

/**
 * LEFT JOIN da assinatura atual como `s` (no máximo uma linha por pessoa).
 * Pessoa sem nenhuma assinatura válida (ou só `pending`) fica com `s.id IS NULL`.
 */
export const CURRENT_SUBSCRIPTION_JOIN = `
  LEFT JOIN subscriptions s ON s.id = (
    SELECT cs.id
    FROM subscriptions cs
    WHERE cs.personId = p.id AND cs.status <> 'pending'
    ORDER BY ${isEffectivelyActiveSql('cs')} DESC, cs.createdAt DESC, cs.id DESC
    LIMIT 1
  )
`;

/** Condição: a pessoa tem alguma assinatura vigente (para filtros sobre a tabela `subscriptions`). */
export const personHasEffectiveActiveSql = (personIdExpr: string) => `EXISTS (
  SELECT 1 FROM subscriptions ea
  WHERE ea.personId = ${personIdExpr} AND ${isEffectivelyActiveSql('ea')}
)`;
