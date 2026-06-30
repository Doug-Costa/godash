/* ===================================================
   DentalGO BI Dashboard — SQL Queries
   Dashboard 100% READ-ONLY no Banco 1 (Clone MySQL)
   =================================================== */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DE SEGMENTAÇÃO DE PLANOS
// Baseadas nos IDs reais do banco dentalgo_production (levantado em 30/06/2026)
// ─────────────────────────────────────────────────────────────────────────────

// IDs de planos anuais PAGOS (geram Caixa do Mês, NÃO entram no MRR)
export const ANNUAL_PLAN_IDS = [88, 87, 86, 283, 20, 10] as const;
// 88  = DentalGo Anual R$58,00
// 87  = DentalGo Anual R$68,00
// 86  = Dental GO Anual R$78,00
// 283 = Dental GO Anual R$89,00
// 20  = Dental Press DentalGO Promocional R$48,00
// 10  = DentalGO Internacional R$78,00

// IDs de planos mensais/recorrentes PAGOS (geram MRR)
export const RECURRING_PLAN_IDS = [262] as const;
// 262 = Dental GO Recorrente R$89,00

// IDs de planos de promoção/trial (gatilho de conversão)
export const PROMO_PLAN_IDS = [274] as const;
// 274 = 15 Dias Gratis

// Preço mínimo em centavos para ser considerado assinante "pago"
// (exclui planos parceiros de R$0,01 e cortesias de R$0,00)
export const MIN_PAID_PRICE_CENTS = 100;

// ─────────────────────────────────────────────────────────────────────────────
// KPIs DE CABEÇALHO
// ─────────────────────────────────────────────────────────────────────────────

export const Q_SUMMARY_KPIS = `
SELECT
  (SELECT COUNT(*) FROM people WHERE admin = 0) AS totalUsers,
  (SELECT COUNT(*) FROM subscriptions s INNER JOIN plans pl ON s.planId = pl.id
   WHERE s.status = 'active' AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%')) AS activeCoreSubscriptions,
  (SELECT COUNT(*) FROM subscriptions s INNER JOIN plans pl ON s.planId = pl.id
   WHERE s.status = 'active' AND pl.title NOT LIKE '%Anual%' AND pl.title NOT LIKE '%Recorrente%') AS activeInstitutionalSubscriptions,
  (SELECT COUNT(*) FROM subscriptions s INNER JOIN plans pl ON s.planId = pl.id
   WHERE s.status = 'canceled' AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%')) AS canceledCoreSubscriptions,
  (SELECT COUNT(*) FROM subscriptions s INNER JOIN plans pl ON s.planId = pl.id
   WHERE s.status = 'active' AND s.expiresIn IS NOT NULL
   AND s.expiresIn <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
   AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%')) AS expiringSoon,
  (SELECT COALESCE(SUM(total), 0) FROM purchases WHERE status = 'success'
   AND YEAR(createdAt) = YEAR(CURDATE()) AND MONTH(createdAt) = MONTH(CURDATE())
   AND id NOT IN (
     SELECT purchaseId FROM purchase_items pi
     JOIN product_items pit ON pi.productItemId = pit.id
     JOIN plans pl ON pit.productId = pl.id
   )) AS looseSalesThisMonth
`;

// ─────────────────────────────────────────────────────────────────────────────
// ÉPICO 6 — SEGREGAÇÃO FINANCEIRA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MRR REAL — apenas assinaturas de planos mensais/recorrentes PAGOS.
 * Critérios: status=active, price > R$1,00 (100 centavos), intervalType='months', intervalCount=1.
 * NÃO inclui planos anuais (esses vão para Caixa do Mês).
 * NÃO inclui planos institucionais/parceiros (price = 1 centavo).
 */
export const Q_MRR_ONLY = `
SELECT
  pl.id AS planId,
  pl.title AS planTitle,
  pl.price AS priceInCents,
  ROUND(pl.price / 100, 2) AS priceInReais,
  COUNT(s.id) AS activeSubscribers,
  ROUND((COUNT(s.id) * pl.price) / 100, 2) AS mrrInReais
FROM subscriptions s
INNER JOIN plans pl ON pl.id = s.planId
WHERE s.status = 'active'
  AND pl.price > ${MIN_PAID_PRICE_CENTS}
  AND pl.intervalType = 'months'
  AND pl.intervalCount = 1
  AND pl.id NOT IN (${ANNUAL_PLAN_IDS.join(',')})
GROUP BY pl.id, pl.title, pl.price
ORDER BY mrrInReais DESC
`;

/**
 * CAIXA DO MÊS (Planos Anuais) — receita de entrada de anuais no mês selecionado.
 * Parâmetro: [YYYY-MM, YYYY-MM] (início e fim do mês)
 * Não deve ser somado ao MRR.
 */
export const Q_ANNUAL_CASH_BY_MONTH = `
SELECT
  pl.id AS planId,
  pl.title AS planTitle,
  pl.price AS priceInCents,
  ROUND(pl.price / 100, 2) AS priceInReais,
  COUNT(s.id) AS newSubscriptions,
  ROUND((COUNT(s.id) * pl.price) / 100, 2) AS cashInReais
FROM subscriptions s
INNER JOIN plans pl ON pl.id = s.planId
WHERE s.status IN ('active', 'expired', 'canceled')
  AND pl.id IN (${ANNUAL_PLAN_IDS.join(',')})
  AND DATE_FORMAT(s.createdAt, '%Y-%m') = ?
GROUP BY pl.id, pl.title, pl.price
ORDER BY cashInReais DESC
`;

/**
 * RESUMO FINANCEIRO DO MÊS — MRR (recorrente) vs Caixa (anual) separados.
 * Parâmetro: [YYYY-MM] (mês no formato '2026-06')
 */
export const Q_FINANCIAL_SUMMARY = `
SELECT
  'mrr_recorrente' AS tipo,
  ROUND(SUM(pl.price) / 100, 2) AS valorReais,
  COUNT(s.id) AS assinantes
FROM subscriptions s
INNER JOIN plans pl ON pl.id = s.planId
WHERE s.status = 'active'
  AND pl.price > ${MIN_PAID_PRICE_CENTS}
  AND pl.intervalType = 'months'
  AND pl.intervalCount = 1
  AND pl.id NOT IN (${ANNUAL_PLAN_IDS.join(',')})

UNION ALL

SELECT
  'caixa_anual' AS tipo,
  ROUND(SUM(pl.price) / 100, 2) AS valorReais,
  COUNT(s.id) AS assinantes
FROM subscriptions s
INNER JOIN plans pl ON pl.id = s.planId
WHERE pl.id IN (${ANNUAL_PLAN_IDS.join(',')})
  AND DATE_FORMAT(s.createdAt, '%Y-%m') = ?
`;

// ─────────────────────────────────────────────────────────────────────────────
// ÉPICO 6 — SEPARAÇÃO SOFTWARE vs LIVROS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CLIENTES "SOMENTE LIVROS" — Compradores de products.productType IN ('book','magazine')
 * que NÃO possuem assinatura ativa de plano pago (price > R$1,00).
 * Objetivo: fila de Upsell Software no Kanban.
 * Parâmetros: nenhum (retorna todos)
 */
export const Q_BOOK_ONLY_LEADS = `
SELECT DISTINCT
  pe.id AS personId,
  pe.fullName,
  pe.email,
  pe.phoneNumber,
  pe.createdAt AS registeredAt,
  GROUP_CONCAT(
    DISTINCT pr.title
    ORDER BY pr.title
    SEPARATOR ' | '
  ) AS produtosComprados,
  COUNT(DISTINCT pu.id) AS totalCompras
FROM people pe
INNER JOIN purchases pu
  ON pu.personId = pe.id
  AND pu.status = 'success'
INNER JOIN purchase_items pi
  ON pi.purchaseId = pu.id
INNER JOIN product_items pti
  ON pti.id = pi.productItemId
INNER JOIN products pr
  ON pr.id = pti.productId
  AND pr.productType IN ('book', 'magazine')
WHERE pe.admin = 0
  AND pe.id NOT IN (
    SELECT s.personId
    FROM subscriptions s
    INNER JOIN plans pl ON pl.id = s.planId
    WHERE s.status = 'active'
      AND pl.price > ${MIN_PAID_PRICE_CENTS}
  )
GROUP BY pe.id, pe.fullName, pe.email, pe.phoneNumber, pe.createdAt
ORDER BY pe.fullName ASC
LIMIT 2000
`;

/**
 * CONTAGEM de clientes somente-livros (para KPI).
 */
export const Q_BOOK_ONLY_COUNT = `
SELECT COUNT(DISTINCT pe.id) AS bookOnlyCount
FROM people pe
INNER JOIN purchases pu ON pu.personId = pe.id AND pu.status = 'success'
INNER JOIN purchase_items pi ON pi.purchaseId = pu.id
INNER JOIN product_items pti ON pti.id = pi.productItemId
INNER JOIN products pr ON pr.id = pti.productId AND pr.productType IN ('book', 'magazine')
WHERE pe.admin = 0
  AND pe.id NOT IN (
    SELECT s.personId FROM subscriptions s
    INNER JOIN plans pl ON pl.id = s.planId
    WHERE s.status = 'active' AND pl.price > ${MIN_PAID_PRICE_CENTS}
  )
`;

// ─────────────────────────────────────────────────────────────────────────────
// ÉPICO 6 — OPORTUNIDADES (Expirações e Promos)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ASSINATURAS EXPIRANDO EM N DIAS.
 * Parâmetros: [days: number, days: number] — janela de dias (ex: [0, 60])
 * Filtra planos pagos core (anuais e recorrentes com price > R$1,00).
 */
export const Q_EXPIRING_SUBSCRIPTIONS = `
SELECT
  pe.id AS personId,
  pe.fullName,
  pe.email,
  pe.phoneNumber,
  pl.id AS planId,
  pl.title AS planTitle,
  ROUND(pl.price / 100, 2) AS priceInReais,
  pl.intervalType,
  s.status,
  s.expiresIn,
  s.isValidUntil,
  DATEDIFF(COALESCE(s.isValidUntil, s.expiresIn), CURDATE()) AS daysUntilExpiry,
  s.createdAt AS subscriptionStart
FROM subscriptions s
INNER JOIN people pe ON pe.id = s.personId
INNER JOIN plans pl ON pl.id = s.planId
WHERE s.status = 'active'
  AND pl.price > ${MIN_PAID_PRICE_CENTS}
  AND (s.isValidUntil IS NOT NULL OR s.expiresIn IS NOT NULL)
  AND DATEDIFF(COALESCE(s.isValidUntil, s.expiresIn), CURDATE()) BETWEEN ? AND ?
ORDER BY COALESCE(s.isValidUntil, s.expiresIn) ASC
LIMIT 500
`;

/**
 * LEADS EM TRIAL/PROMO (15 Dias Grátis, ID 274) — disparo de conversão.
 * Retorna leads no plano de trial ainda ativos, ordenados pelos mais antigos
 * (mais urgentes para conversão).
 * Parâmetros: nenhum
 */
export const Q_PROMO_LEADS = `
SELECT
  pe.id AS personId,
  pe.fullName,
  pe.email,
  pe.phoneNumber,
  pe.createdAt AS registeredAt,
  pl.title AS planTitle,
  s.createdAt AS trialStartAt,
  DATEDIFF(CURDATE(), s.createdAt) AS daysInTrial,
  s.status
FROM subscriptions s
INNER JOIN people pe ON pe.id = s.personId
INNER JOIN plans pl ON pl.id = s.planId
WHERE s.status = 'active'
  AND pl.id IN (${PROMO_PLAN_IDS.join(',')})
ORDER BY s.createdAt ASC
LIMIT 500
`;

/**
 * LEADS EM PLANOS CORTESIA (gratuitos ou R$0,01) — candidatos a upsell.
 * Inclui: Cortesia Alunos, Cortesia Dental Press, DentalGO Cortesia, etc.
 */
export const Q_COURTESY_LEADS = `
SELECT
  pe.id AS personId,
  pe.fullName,
  pe.email,
  pe.phoneNumber,
  pl.id AS planId,
  pl.title AS planTitle,
  s.createdAt AS subscriptionStart,
  DATEDIFF(CURDATE(), s.createdAt) AS daysAsCourtesy
FROM subscriptions s
INNER JOIN people pe ON pe.id = s.personId
INNER JOIN plans pl ON pl.id = s.planId
WHERE s.status = 'active'
  AND pl.price <= ${MIN_PAID_PRICE_CENTS}
  AND pl.id NOT IN (${[...ANNUAL_PLAN_IDS, ...RECURRING_PLAN_IDS].join(',')})
ORDER BY s.createdAt ASC
LIMIT 1000
`;

/**
 * NOVAS ASSINATURAS DO DIA — para o Sync do Pós-Venda.
 * Parâmetros: [YYYY-MM-DD, YYYY-MM-DD] (início e fim do dia, ex: hoje)
 * Retorna assinaturas de planos pagos criadas no intervalo.
 */
export const Q_NEW_SUBSCRIPTIONS_IN_RANGE = `
SELECT
  s.id AS subscriptionId,
  s.personId,
  s.planId,
  s.createdAt AS startAt,
  s.status,
  pe.fullName,
  pe.email,
  pe.phoneNumber,
  pl.title AS planTitle,
  pl.price AS priceInCents,
  pl.intervalType
FROM subscriptions s
INNER JOIN people pe ON pe.id = s.personId
INNER JOIN plans pl ON pl.id = s.planId
WHERE s.status IN ('active')
  AND pl.price > ${MIN_PAID_PRICE_CENTS}
  AND s.createdAt >= ?
  AND s.createdAt < ?
ORDER BY s.createdAt ASC
`;

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES EXISTENTES (mantidas)
// ─────────────────────────────────────────────────────────────────────────────

export const Q_MRR_MONTHLY_AMORTIZED = `
SELECT 
  DATE_FORMAT(DATE_ADD(p.createdAt, INTERVAL t.m MONTH), '%Y-%m') AS period,
  SUM(CASE WHEN pl.title LIKE '%Anual%' THEN p.total / 12 ELSE p.total END) AS revenue
FROM purchases p
JOIN purchase_items pi ON p.id = pi.purchaseId
JOIN product_items pit ON pi.productItemId = pit.id
JOIN plans pl ON pit.productId = pl.id
CROSS JOIN (SELECT 0 AS m UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11) t
WHERE p.status = 'success'
  AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%')
  AND ((pl.title LIKE '%Anual%' AND t.m < 12) OR (pl.title NOT LIKE '%Anual%' AND t.m = 0))
GROUP BY period
ORDER BY period DESC
LIMIT 24
`;

export const Q_DAILY_REVENUE_SEGMENTED = `
SELECT 
  DATE_FORMAT(p.createdAt, '%Y-%m-%d') AS period,
  SUM(CASE WHEN pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%' THEN p.total ELSE 0 END) AS mrr_total,
  SUM(CASE WHEN pit.productId IS NULL THEN p.total ELSE 0 END) AS sales_total
FROM purchases p
LEFT JOIN purchase_items pi ON p.id = pi.purchaseId
LEFT JOIN product_items pit ON pi.productItemId = pit.id
LEFT JOIN plans pl ON pit.productId = pl.id
WHERE p.status = 'success'
  AND p.createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
GROUP BY period
ORDER BY period ASC
`;

export const Q_LOOSE_SALES_MONTHLY = `
SELECT
  DATE_FORMAT(createdAt, '%Y-%m') AS period,
  SUM(total) AS revenue
FROM purchases p
WHERE status = 'success'
  AND id NOT IN (
    SELECT purchaseId FROM purchase_items pi JOIN product_items pit ON pi.productItemId = pit.id JOIN plans pl ON pit.productId = pl.id
  )
GROUP BY period
ORDER BY period DESC
LIMIT 12
`;

export const Q_USERS_BY_PLAN = `
SELECT pl.id as planId, pl.title as planTitle, COUNT(s.id) as subscriberCount
FROM subscriptions s JOIN plans pl ON s.planId = pl.id
WHERE s.status = 'active' GROUP BY pl.id, pl.title ORDER BY subscriberCount DESC
`;

export const Q_USERS_BY_CATEGORY = `
SELECT
  SUM(CASE WHEN pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%' THEN 1 ELSE 0 END) AS coreUsers,
  SUM(CASE WHEN pl.title NOT LIKE '%Anual%' AND pl.title NOT LIKE '%Recorrente%' THEN 1 ELSE 0 END) AS institutionalUsers
FROM subscriptions s
INNER JOIN plans pl ON s.planId = pl.id
WHERE s.status = 'active'
`;

export const Q_REVENUE_BY_PLAN = `
SELECT
  pl.id AS planId,
  pl.title AS planTitle,
  pl.price,
  pl.intervalType,
  COUNT(s.id) AS activeSubscribers,
  (COUNT(s.id) * CASE WHEN pl.title LIKE '%Anual%' THEN (pl.price / 12) ELSE pl.price END) AS estimatedMRR
FROM subscriptions s
INNER JOIN plans pl ON s.planId = pl.id
WHERE s.status = 'active' 
  AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%')
GROUP BY pl.id, pl.title, pl.price, pl.intervalType
ORDER BY estimatedMRR DESC
`;

export const Q_CHURN_MONTHLY_CORE = `
SELECT DATE_FORMAT(s.canceledAt, '%Y-%m') as month, COUNT(*) as canceled
FROM subscriptions s JOIN plans pl ON s.planId = pl.id
WHERE s.status = 'canceled' AND s.canceledAt >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%')
GROUP BY month ORDER BY month ASC
`;

export const Q_ACTIVE_BY_MONTH_CORE = `
SELECT DATE_FORMAT(s.createdAt, '%Y-%m') as month, COUNT(*) as newSubscriptions
FROM subscriptions s JOIN plans pl ON s.planId = pl.id
WHERE s.createdAt >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%')
GROUP BY month ORDER BY month ASC
`;

export const Q_COHORT_RETENTION_CORE = `
SELECT
  DATE_FORMAT(s.createdAt, '%Y-%m') AS cohort,
  COUNT(DISTINCT s.id) AS registered,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS stillActive
FROM subscriptions s
INNER JOIN plans pl ON s.planId = pl.id
WHERE (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%')
GROUP BY cohort DESC
LIMIT 12
`;

export const Q_LTV_AVG = `
SELECT AVG(userTotal) as avgLTV, MAX(userTotal) as maxLTV, MIN(userTotal) as minLTV
FROM (SELECT personId, SUM(total) as userTotal FROM purchases WHERE status = 'success' GROUP BY personId) as ltv
`;

export const Q_AVG_CUSTOMER_LIFETIME = `
SELECT AVG(DATEDIFF(lastP, firstP)) as avgLifetimeDays
FROM (SELECT personId, MIN(createdAt) as firstP, MAX(createdAt) as lastP FROM purchases WHERE status = 'success' GROUP BY personId HAVING COUNT(*) > 1) as lt
`;

export const Q_EXPIRING_SOON_CORE = `
SELECT p.fullName, p.email, pl.title AS planTitle, s.expiresIn, DATEDIFF(s.expiresIn, CURDATE()) AS daysLeft
FROM subscriptions s JOIN people p ON s.personId = p.id JOIN plans pl ON s.planId = pl.id
WHERE s.status = 'active' AND s.expiresIn IS NOT NULL AND s.expiresIn <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%') AND s.expiresIn >= CURDATE()
ORDER BY s.expiresIn ASC LIMIT 100
`;
