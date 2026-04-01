/* ===================================================
   DentalGO BI Dashboard — SQL Queries
   Dashboard 100% READ-ONLY
   =================================================== */

// ── KPIs de Cabeçalho ──
export const Q_SUMMARY_KPIS = `
SELECT
  (SELECT COUNT(*) FROM people WHERE admin = 0) AS totalUsers,
  (SELECT COUNT(*) FROM subscriptions s INNER JOIN plans pl ON s.planId = pl.id WHERE s.status = 'active' AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%')) AS activeCoreSubscriptions,
  (SELECT COUNT(*) FROM subscriptions s INNER JOIN plans pl ON s.planId = pl.id WHERE s.status = 'active' AND pl.title NOT LIKE '%Anual%' AND pl.title NOT LIKE '%Recorrente%') AS activeInstitutionalSubscriptions,
  (SELECT COUNT(*) FROM subscriptions s INNER JOIN plans pl ON s.planId = pl.id WHERE s.status = 'canceled' AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%')) AS canceledCoreSubscriptions,
  (SELECT COUNT(*) FROM subscriptions s INNER JOIN plans pl ON s.planId = pl.id WHERE s.status = 'active' AND s.expiresIn IS NOT NULL AND s.expiresIn <= DATE_ADD(CURDATE(), INTERVAL ? DAY) AND (pl.title LIKE '%Anual%' OR pl.title LIKE '%Recorrente%')) AS expiringSoon,
  (SELECT COALESCE(SUM(total), 0) FROM purchases WHERE status = 'success' AND YEAR(createdAt) = YEAR(CURDATE()) AND MONTH(createdAt) = MONTH(CURDATE()) AND id NOT IN (
    SELECT purchaseId FROM purchase_items pi JOIN product_items pit ON pi.productItemId = pit.id JOIN plans pl ON pit.productId = pl.id
  )) AS looseSalesThisMonth
`;

// ── Receita Amortizada (Mensal) ──
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

// ── Receita Amortizada (Diária) ──
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

// ── Vendas Avulsas Mensais ──
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

// ── Outros KPIs / Listagens ──
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
