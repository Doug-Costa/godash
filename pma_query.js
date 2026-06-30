/**
 * pma_query.js
 * Autentica no phpMyAdmin e roda queries SQL via HTTP
 * Node 22+ (fetch nativo, sem dependências extras)
 */

const BASE = 'http://187.77.48.78:8888';
const USER = 'xkey';
const PASS = 'xkey@2026*';
const DB   = 'dentalgo_production';

// ── helpers ──────────────────────────────────────────────────────────────────

function cookieHeader(jar) {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
}

function parseCookies(headers, jar = {}) {
  const vals = headers.getSetCookie ? headers.getSetCookie() : [];
  for (const c of vals) {
    const [pair] = c.split(';');
    const [k, v] = pair.split('=');
    if (k && v !== undefined) jar[k.trim()] = v.trim();
  }
  return jar;
}

function extract(html, pattern) {
  const m = html.match(pattern);
  return m ? m[1] : null;
}

function printTable(rows) {
  if (!rows || rows.length === 0) { console.log('  (sem resultados)'); return; }
  // Pega chaves do primeiro objeto
  const keys = Object.keys(rows[0]);
  const widths = keys.map(k => Math.max(k.length, ...rows.map(r => String(r[k] ?? '').length)));
  const header = keys.map((k, i) => k.padEnd(widths[i])).join(' | ');
  const divider = widths.map(w => '-'.repeat(w)).join('-+-');
  console.log('  ' + header);
  console.log('  ' + divider);
  rows.forEach(r => {
    const line = keys.map((k, i) => String(r[k] ?? '').padEnd(widths[i])).join(' | ');
    console.log('  ' + line);
  });
  console.log(`  (${rows.length} registros)`);
}

function sep(label) {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${label}`);
  console.log('═'.repeat(70));
}

// ── autenticação ─────────────────────────────────────────────────────────────

async function login() {
  // 1. GET página de login para pegar token e cookies
  const r1 = await fetch(`${BASE}/index.php`, { redirect: 'follow' });
  const jar = parseCookies(r1.headers);
  const html1 = await r1.text();

  const token = extract(html1, /name="token"\s+value="([^"]+)"/)
             || extract(html1, /name="token" value="([^"]+)"/)
             || extract(html1, /"token":"([^"]+)"/);

  if (!token) {
    // Tenta pegar em script inline
    const m2 = html1.match(/token['":\s]+([a-f0-9]{32,})/i);
    if (!m2) throw new Error('Não foi possível extrair token CSRF da página de login');
  }

  const csrf = token || extract(html1, /token['":\s]+([a-f0-9]{32,})/i)?.[1];
  console.log(`  Token CSRF: ${csrf}`);

  // 2. POST credenciais
  const body = new URLSearchParams({
    token: csrf,
    pma_username: USER,
    pma_password: PASS,
    server: '1',
  });

  const r2 = await fetch(`${BASE}/index.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieHeader(jar),
      'Referer': `${BASE}/index.php`,
    },
    body: body.toString(),
    redirect: 'follow',
  });

  parseCookies(r2.headers, jar);
  const html2 = await r2.text();

  // Verifica se logou
  if (html2.includes('Access denied') || html2.includes('Cannot log in')) {
    throw new Error('Login falhou: credenciais inválidas ou bloqueadas');
  }

  // Pega novo token pós-login
  const token2 = extract(html2, /name="token"\s+value="([^"]+)"/)
              || extract(html2, /"token":"([^"]+)"/)
              || csrf;

  console.log(`  Login OK. Token pós-login: ${token2}`);
  return { jar, token: token2 };
}

// ── executar SQL ──────────────────────────────────────────────────────────────

async function runSQL(sql, { jar, token }) {
  const body = new URLSearchParams({
    db: DB,
    token: token,
    sql_query: sql,
    sql_delimiter: ';',
    show_query: '1',
    ajax_request: '1',
  });

  const r = await fetch(`${BASE}/index.php?route=/import&db=${encodeURIComponent(DB)}&ajax_request=1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieHeader(jar),
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${BASE}/index.php?route=/database/sql&db=${encodeURIComponent(DB)}`,
    },
    body: body.toString(),
  });

  parseCookies(r.headers, jar);
  const text = await r.text();

  // Tenta parsear como JSON (phpMyAdmin retorna JSON em mode ajax)
  try {
    const json = JSON.parse(text);
    return { json, raw: text };
  } catch {
    return { json: null, raw: text };
  }
}

// ── parsear resultados HTML do phpMyAdmin ─────────────────────────────────────

function parseHtmlTable(html) {
  if (!html) return [];
  const rows = [];
  const headerMatch = html.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
  const bodyMatch   = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);

  if (!headerMatch || !bodyMatch) return [];

  const headers = [...headerMatch[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim());

  const trMatches = [...bodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const tr of trMatches) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, '').trim());
    if (cells.length > 0) {
      const row = {};
      headers.forEach((h, i) => { row[h] = cells[i] ?? ''; });
      rows.push(row);
    }
  }
  return rows;
}

// ── método alternativo: GET via SQL route ─────────────────────────────────────

async function runSQLvia(sql, { jar, token }) {
  // Alguns phpMyAdmin suportam query via GET no endpoint de SQL
  const params = new URLSearchParams({
    route: '/sql',
    db: DB,
    sql_query: sql,
    token: token,
  });

  const r = await fetch(`${BASE}/index.php?${params}`, {
    headers: {
      'Cookie': cookieHeader(jar),
      'Referer': `${BASE}/index.php?route=/database/sql&db=${DB}`,
    },
  });
  parseCookies(r.headers, jar);
  const html = await r.text();

  // Extrai token atualizado
  const newToken = extract(html, /name="token"\s+value="([^"]+)"/)
                || extract(html, /"token":"([^"]+)"/)
                || token;

  return { html, token: newToken };
}

// ── Main ───────────────────────────────────────────────────────────────────────

const QUERIES = [
  { label: '1. TABELAS DO BANCO', sql: 'SHOW TABLES' },
  { label: '2. ESTRUTURA: plans', sql: 'DESCRIBE plans' },
  { label: '3. TODOS OS PLANOS', sql: 'SELECT id, title, price, intervalType FROM plans ORDER BY price ASC LIMIT 100' },
  { label: '4. ESTRUTURA: people', sql: 'DESCRIBE people' },
  { label: '5. ESTRUTURA: subscriptions', sql: 'DESCRIBE subscriptions' },
  { label: '6. ESTRUTURA: products', sql: 'DESCRIBE products' },
  { label: '7. ESTRUTURA: purchases', sql: 'DESCRIBE purchases' },
  { label: '8. RESUMO GERAL', sql: `SELECT
    (SELECT COUNT(*) FROM people WHERE admin=0) AS total_clientes,
    (SELECT COUNT(*) FROM subscriptions WHERE status='active') AS subs_ativas,
    (SELECT COUNT(*) FROM subscriptions WHERE status='canceled') AS subs_canceladas,
    (SELECT COUNT(*) FROM subscriptions WHERE status NOT IN ('active','canceled')) AS outros_status,
    (SELECT COUNT(*) FROM plans) AS total_planos,
    (SELECT COUNT(*) FROM products) AS total_produtos,
    (SELECT COUNT(*) FROM purchases WHERE status='success') AS compras_ok` },
  { label: '9. STATUS EM subscriptions', sql: `SELECT status, COUNT(*) as qtd FROM subscriptions GROUP BY status ORDER BY qtd DESC` },
  { label: '10. PLANOS × ASSINANTES ATIVOS', sql: `SELECT p.id, p.title, p.price, p.intervalType,
    COUNT(s.id) AS total_assinantes,
    SUM(CASE WHEN s.status='active' THEN 1 ELSE 0 END) AS ativos,
    SUM(CASE WHEN s.status='canceled' THEN 1 ELSE 0 END) AS cancelados
  FROM plans p
  LEFT JOIN subscriptions s ON s.planId=p.id
  GROUP BY p.id, p.title, p.price, p.intervalType
  ORDER BY ativos DESC` },
  { label: '11. PRODUTOS (lista completa)', sql: 'SELECT * FROM products LIMIT 100' },
  { label: '12. TIPOS DE PRODUTOS', sql: `SELECT type, COUNT(*) as qtd FROM products GROUP BY type ORDER BY qtd DESC` },
  { label: '13. CLIENTS COM COMPRAS MAS SEM SUB ATIVA', sql: `SELECT DISTINCT pe.id, pe.fullName, pe.email, pe.phoneNumber
  FROM people pe
  INNER JOIN purchases pu ON pu.personId=pe.id AND pu.status='success'
  WHERE pe.admin=0
    AND pe.id NOT IN (SELECT personId FROM subscriptions WHERE status='active')
  ORDER BY pe.fullName
  LIMIT 200` },
  { label: '14. CLIENTES COM SUB ATIVA (amostra)', sql: `SELECT pe.id, pe.fullName, pe.email, pe.phoneNumber,
    pl.title AS plano, pl.price AS valor, pl.intervalType, s.status, s.isValidUntil
  FROM people pe
  INNER JOIN subscriptions s ON s.personId=pe.id
  INNER JOIN plans pl ON pl.id=s.planId
  WHERE s.status='active' AND pe.admin=0
  ORDER BY s.createdAt DESC
  LIMIT 50` },
  { label: '15. PURCHASE_ITEMS ESTRUTURA', sql: 'DESCRIBE purchase_items' },
  { label: '16. PRODUCT_ITEMS ESTRUTURA', sql: 'DESCRIBE product_items' },
];

async function main() {
  console.log('🔐 Autenticando no phpMyAdmin...');
  let session;
  try {
    session = await login();
  } catch (e) {
    console.error('❌ Falha no login:', e.message);
    process.exit(1);
  }

  const results = {};

  for (const { label, sql } of QUERIES) {
    sep(label);
    try {
      const { html, token } = await runSQLvia(sql, session);
      session.token = token; // Atualiza token

      // Verifica erro
      if (html.includes('1146') || html.includes("doesn't exist")) {
        console.log('  ⚠️  Tabela não existe — pulando');
        results[label] = [];
        continue;
      }

      const rows = parseHtmlTable(html);
      if (rows.length > 0) {
        printTable(rows);
        results[label] = rows;
      } else {
        // Tenta extrair valor de erro ou mensagem
        const errMatch = html.match(/class="[^"]*error[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (errMatch) {
          console.log('  ⚠️  Erro SQL:', errMatch[1].replace(/<[^>]+>/g, '').trim());
        } else {
          console.log('  (sem resultados ou HTML não parseável)');
          // Salva trecho do HTML para debug
          console.log('  HTML snippet:', html.slice(0, 300).replace(/\s+/g, ' '));
        }
        results[label] = [];
      }
    } catch (e) {
      console.log(`  ❌ Erro: ${e.message}`);
      results[label] = [];
    }

    // Pequena pausa entre queries
    await new Promise(r => setTimeout(r, 300));
  }

  // Salva resultados em JSON
  const fs = await import('fs');
  fs.writeFileSync('db_analysis.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('\n\n✅ Resultados salvos em db_analysis.json');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
