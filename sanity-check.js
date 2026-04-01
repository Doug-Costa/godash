const fs = require('fs');
const content = fs.readFileSync('src/lib/queries.ts', 'utf8');
const expectedExports = [
  'Q_SUMMARY_KPIS',
  'Q_MRR_MONTHLY_AMORTIZED',
  'Q_DAILY_REVENUE_SEGMENTED',
  'Q_LOOSE_SALES_MONTHLY',
  'Q_USERS_BY_PLAN',
  'Q_USERS_BY_CATEGORY',
  'Q_REVENUE_BY_PLAN',
  'Q_CHURN_MONTHLY_CORE',
  'Q_ACTIVE_BY_MONTH_CORE',
  'Q_COHORT_RETENTION_CORE',
  'Q_LTV_AVG',
  'Q_AVG_CUSTOMER_LIFETIME',
  'Q_EXPIRING_SOON_CORE'
];

console.log('--- Checking src/lib/queries.ts exports ---');
expectedExports.forEach(exp => {
  const exists = content.includes(`export const ${exp}`);
  console.log(`${exp}: ${exists ? 'OK' : 'MISSING'}`);
});
