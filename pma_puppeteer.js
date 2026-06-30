/**
 * pma_puppeteer.js  v4 — FINAL
 * Baseado em diagnóstico real:
 *  - CodeMirror: window.codeMirrorEditor (não codemirror_editor)
 *  - Botão: #button_submit_query
 *  - Form: POST para /index.php?route=/import → navegação real
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = 'http://187.77.48.78:8888';
const USER = 'xkey';
const PASS = 'xkey@2026*';
const DB   = 'dentalgo_production';
const SHOT_DIR = 'screenshots';

if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

function sep(label) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${label}`);
  console.log('═'.repeat(60));
}

async function shot(page, name) {
  try { await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`) }); } catch (_) {}
}

// Seta SQL via codeMirrorEditor (nome correto descoberto no debug)
async function setSQL(page, sql) {
  return page.evaluate((sqlText) => {
    // Nome real: window.codeMirrorEditor
    if (window.codeMirrorEditor) {
      window.codeMirrorEditor.setValue(sqlText);
      return 'window.codeMirrorEditor';
    }
    const cm = document.querySelector('.CodeMirror');
    if (cm && cm.CodeMirror) {
      cm.CodeMirror.setValue(sqlText);
      return '.CodeMirror.CodeMirror';
    }
    const ta = document.querySelector('#sqlquery');
    if (ta) {
      ta.value = sqlText;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return 'textarea#sqlquery';
    }
    return null;
  }, sql);
}

// Extrai resultados da página de resultado do phpMyAdmin
async function extractResults(page) {
  return page.evaluate(() => {
    // phpMyAdmin renderiza resultados em .table_results (class) ou tabela com class resultdata
    const candidates = [
      document.querySelector('table.table_results'),
      document.querySelector('.resultdata'),
      document.querySelector('#table_results'),
      document.querySelector('table.data'),
      // DESCRIBE/SHOW retornam uma tabela simples
      ...[...document.querySelectorAll('table')].filter(t => {
        const ths = t.querySelectorAll('thead th');
        return ths.length >= 2;
      }),
    ].filter(Boolean);

    for (const table of candidates) {
      const ths = [...table.querySelectorAll('thead th, tr:first-child th')]
        .map(th => th.innerText.replace(/[▲▼↑↓#]/g, '').trim())
        .filter(Boolean);

      if (ths.length === 0) continue;

      const bodyRows = table.querySelectorAll('tbody tr') .length > 0
        ? [...table.querySelectorAll('tbody tr')]
        : [...table.querySelectorAll('tr')].slice(1);

      const rows = bodyRows.map(tr => {
        const tds = [...tr.querySelectorAll('td')].map(td => td.innerText.trim());
        if (!tds.length) return null;
        const obj = {};
        ths.forEach((h, i) => { obj[h] = tds[i] ?? ''; });
        return obj;
      }).filter(Boolean);

      if (rows.length > 0) return rows;
    }
    return [];
  });
}

async function runSQL(page, sql, idx) {
  // Navega para a rota SQL
  await page.goto(
    `${BASE}/index.php?route=/database/sql&db=${encodeURIComponent(DB)}`,
    { waitUntil: 'domcontentloaded', timeout: 20000 }
  );

  // Aguarda CodeMirror inicializar
  await page.waitForFunction(
    () => document.querySelector('.CodeMirror') || document.querySelector('#sqlquery'),
    { timeout: 10000 }
  );
  await new Promise(r => setTimeout(r, 800));

  // Seta o SQL
  const method = await setSQL(page, sql);
  if (!method) throw new Error('Editor SQL não encontrado');
  
  // Submete e aguarda navegação para /import
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
    page.click('#button_submit_query'),
  ]);

  // Verifica erro SQL
  const errorText = await page.evaluate(() => {
    const sel = '.error_message, .alert-danger, #pma_errors .error_message, .pma_errors';
    const el = document.querySelector(sel);
    return el ? el.innerText.trim() : null;
  });

  if (errorText) return { error: errorText, rows: [] };

  const rows = await extractResults(page);
  await shot(page, `q${String(idx).padStart(2,'0')}_result`);
  return { error: null, rows };
}

function printTable(rows, limit = 30) {
  if (!rows || rows.length === 0) { console.log('  (sem resultados)'); return; }
  const show = rows.slice(0, limit);
  const keys = Object.keys(show[0]);
  const widths = keys.map(k =>
    Math.min(50, Math.max(k.length, ...show.map(r => String(r[k] ?? '').length)))
  );
  console.log('  ' + keys.map((k, i) => k.padEnd(widths[i])).join(' | '));
  console.log('  ' + widths.map(w => '-'.repeat(w)).join('-+-'));
  for (const r of show) {
    console.log('  ' + keys.map((k, i) =>
      String(r[k] ?? '').slice(0, widths[i]).padEnd(widths[i])
    ).join(' | '));
  }
  if (rows.length > limit) console.log(`  ... +${rows.length - limit} mais registros`);
  console.log(`  ↳ TOTAL: ${rows.length} registro(s)`);
}

function toMd(rows) {
  if (!rows || rows.length === 0) return '_sem resultados_';
  const keys = Object.keys(rows[0]);
  const hdr  = `| ${keys.join(' | ')} |`;
  const div  = `| ${keys.map(() => '---').join(' | ')} |`;
  const body = rows.map(r =>
    `| ${keys.map(k =>
      String(r[k] ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 200)
    ).join(' | ')} |`
  ).join('\n');
  return `${hdr}\n${div}\n${body}\n\n_${rows.length} registro(s)_`;
}

// ── QUERIES ──────────────────────────────────────────────────────────────────
const QUERIES = [
  {
    key: 'tables', label: '1. TABELAS DO BANCO',
    sql: 'SHOW TABLES'
  },
  {
    key: 'plans_desc', label: '2. ESTRUTURA: plans',
    sql: 'DESCRIBE plans'
  },
  {
    key: 'plans', label: '3. TODOS OS PLANOS (plans)',
    sql: 'SELECT id, title, price, intervalType FROM plans ORDER BY price ASC LIMIT 100'
  },
  {
    key: 'people_desc', label: '4. ESTRUTURA: people',
    sql: 'DESCRIBE people'
  },
  {
    key: 'subs_desc', label: '5. ESTRUTURA: subscriptions',
    sql: 'DESCRIBE subscriptions'
  },
  {
    key: 'prods_desc', label: '6. ESTRUTURA: products',
    sql: 'DESCRIBE products'
  },
  {
    key: 'purch_desc', label: '7. ESTRUTURA: purchases',
    sql: 'DESCRIBE purchases'
  },
  {
    key: 'summary', label: '8. RESUMO GERAL (contagens)',
    sql: "SELECT (SELECT COUNT(*) FROM people WHERE admin=0) AS total_clientes, (SELECT COUNT(*) FROM subscriptions WHERE status='active') AS subs_ativas, (SELECT COUNT(*) FROM subscriptions WHERE status='canceled') AS subs_canceladas, (SELECT COUNT(*) FROM plans) AS total_planos, (SELECT COUNT(*) FROM products) AS total_produtos, (SELECT COUNT(*) FROM purchases WHERE status='success') AS compras_ok"
  },
  {
    key: 'sub_statuses', label: '9. STATUS em subscriptions',
    sql: "SELECT status, COUNT(*) qtd FROM subscriptions GROUP BY status ORDER BY qtd DESC"
  },
  {
    key: 'plans_x_subs', label: '10. PLANOS × ASSINANTES',
    sql: "SELECT p.id, p.title, p.price, p.intervalType, COUNT(s.id) AS total_assinantes, SUM(CASE WHEN s.status='active' THEN 1 ELSE 0 END) AS ativos, SUM(CASE WHEN s.status='canceled' THEN 1 ELSE 0 END) AS cancelados FROM plans p LEFT JOIN subscriptions s ON s.planId=p.id GROUP BY p.id, p.title, p.price, p.intervalType ORDER BY ativos DESC"
  },
  {
    key: 'products', label: '11. PRODUTOS (completo)',
    sql: 'SELECT * FROM products ORDER BY id LIMIT 100'
  },
  {
    key: 'pi_desc', label: '12. ESTRUTURA: purchase_items',
    sql: 'DESCRIBE purchase_items'
  },
  {
    key: 'pti_desc', label: '13. ESTRUTURA: product_items',
    sql: 'DESCRIBE product_items'
  },
  {
    key: 'buyers_nosub', label: '14. COMPRADORES SEM ASSINATURA ATIVA',
    sql: "SELECT DISTINCT pe.id, pe.fullName, pe.email, pe.phoneNumber FROM people pe INNER JOIN purchases pu ON pu.personId=pe.id AND pu.status='success' WHERE pe.admin=0 AND pe.id NOT IN (SELECT personId FROM subscriptions WHERE status='active') ORDER BY pe.fullName LIMIT 500"
  },
  {
    key: 'active_subs_sample', label: '15. ASSINANTES ATIVOS (amostra 50)',
    sql: "SELECT pe.id, pe.fullName, pe.email, pe.phoneNumber, pl.title AS plano, pl.price AS valor, pl.intervalType, s.status, s.isValidUntil FROM people pe INNER JOIN subscriptions s ON s.personId=pe.id INNER JOIN plans pl ON pl.id=s.planId WHERE s.status='active' AND pe.admin=0 ORDER BY s.createdAt DESC LIMIT 50"
  },
  {
    key: 'all_active_subs', label: '16. TODOS ASSINANTES ATIVOS (completo)',
    sql: "SELECT pe.id, pe.fullName, pe.email, pe.phoneNumber, pl.title AS plano, pl.price AS valor, pl.intervalType, s.status, s.createdAt AS inicio, s.isValidUntil FROM people pe INNER JOIN subscriptions s ON s.personId=pe.id INNER JOIN plans pl ON pl.id=s.planId WHERE s.status='active' AND pe.admin=0 ORDER BY pl.title, pe.fullName LIMIT 2000"
  },
  {
    key: 'canceled_subs', label: '17. ASSINANTES CANCELADOS (amostra 100)',
    sql: "SELECT pe.id, pe.fullName, pe.email, pe.phoneNumber, pl.title AS plano, s.status, s.canceledAt FROM people pe INNER JOIN subscriptions s ON s.personId=pe.id INNER JOIN plans pl ON pl.id=s.planId WHERE s.status='canceled' AND pe.admin=0 ORDER BY s.canceledAt DESC LIMIT 100"
  },
  {
    key: 'abandoned', label: '18. CADASTROS SEM SUB E SEM COMPRA (abandonados)',
    sql: "SELECT pe.id, pe.fullName, pe.email, pe.phoneNumber, pe.createdAt FROM people pe WHERE pe.admin=0 AND pe.id NOT IN (SELECT DISTINCT personId FROM subscriptions) AND pe.id NOT IN (SELECT DISTINCT personId FROM purchases WHERE status='success') ORDER BY pe.createdAt DESC LIMIT 200"
  },
];

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 pma_puppeteer v4 — iniciando...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);

  try {
    // LOGIN
    console.log(`\n🔐 Login em ${BASE}...`);
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('#input_username', { timeout: 10000 });
    await page.focus('#input_username');
    await page.keyboard.type(USER);
    await page.focus('#input_password');
    await page.keyboard.type(PASS);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
      page.click('#input_go'),
    ]);

    const loginUrl = page.url();
    if (loginUrl.includes('route=/login') || loginUrl.includes('signin')) {
      throw new Error('Login falhou!');
    }
    console.log(`  ✅ Login OK! URL: ${loginUrl}\n`);

    // EXECUTA QUERIES
    const results = {};
    const mdParts = [
      `# Análise DentalGO Production`,
      `> Banco: **dentalgo_production** | Gerado: ${new Date().toLocaleString('pt-BR')}\n`,
    ];

    for (let i = 0; i < QUERIES.length; i++) {
      const { key, label, sql } = QUERIES[i];
      sep(label);
      console.log(`  SQL: ${sql.replace(/\s+/g, ' ').slice(0, 100)}...`);

      try {
        const { error, rows } = await runSQL(page, sql, i + 1);

        if (error) {
          console.log(`  ⚠️  Erro SQL:\n  ${error.slice(0, 200)}`);
          results[key] = [];
          mdParts.push(`## ${label}\n\n> ⚠️ Erro: ${error.slice(0, 300)}\n`);
        } else {
          printTable(rows);
          results[key] = rows;
          mdParts.push(`## ${label}\n\n${toMd(rows)}\n`);
        }
      } catch (e) {
        console.log(`  ❌ ${e.message}`);
        results[key] = [];
        mdParts.push(`## ${label}\n\n> ❌ ${e.message}\n`);
        await shot(page, `err_q${i + 1}_${key}`);
      }

      await new Promise(r => setTimeout(r, 400));
    }

    // Salva resultados
    fs.writeFileSync('db_analysis_full.json', JSON.stringify(results, null, 2), 'utf8');
    fs.writeFileSync('db_analysis_full.md', mdParts.join('\n'), 'utf8');

    console.log('\n\n' + '═'.repeat(60));
    console.log('  ✅ ANÁLISE CONCLUÍDA!');
    console.log('═'.repeat(60));
    console.log('  Arquivos gerados:');
    console.log('  - db_analysis_full.json');
    console.log('  - db_analysis_full.md');
    console.log(`  - screenshots/ (${QUERIES.length + 5} imagens)`);

  } finally {
    await browser.close();
    console.log('\n🔒 Browser fechado.');
  }
}

main().catch(e => {
  console.error('\nFATAL:', e.message);
  process.exit(1);
});
