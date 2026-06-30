/**
 * analyze_db.js
 * Script de análise das tabelas do dentalgo_production
 * Conecta ao clone MySQL local via 187.77.48.78:3306
 */

const mysql = require('mysql2/promise');

// Credenciais do clone local conforme usuário informou
const config = {
  host: '187.77.48.78',
  port: 3306,
  user: 'xkey',
  password: 'xkey@2026*',
  database: 'dentalgo_production',
  ssl: { rejectUnauthorized: false },
  connectTimeout: 20000,
};

function sep(label) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${label}`);
  console.log('='.repeat(70));
}

function printTable(rows) {
  if (!rows || rows.length === 0) { console.log('  (sem resultados)'); return; }
  console.table(rows);
}

async function run() {
  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // ── 1. TABELAS DISPONÍVEIS ──────────────────────────────────────────────
    sep('1. TABELAS DO BANCO');
    const [tables] = await conn.query('SHOW TABLES');
    printTable(tables);

    // ── 2. ESTRUTURA: plans ─────────────────────────────────────────────────
    sep('2. ESTRUTURA: plans');
    const [plansCols] = await conn.query('DESCRIBE plans');
    printTable(plansCols);

    // ── 3. TODOS OS PLANOS ──────────────────────────────────────────────────
    sep('3. TODOS OS PLANOS (plans)');
    const [plans] = await conn.query(`
      SELECT id, title, price, intervalType
      FROM plans
      ORDER BY price ASC
      LIMIT 100
    `);
    printTable(plans);

    // ── 4. ESTRUTURA: people ────────────────────────────────────────────────
    sep('4. ESTRUTURA: people');
    const [peopleCols] = await conn.query('DESCRIBE people');
    printTable(peopleCols);

    // ── 5. ESTRUTURA: subscriptions ─────────────────────────────────────────
    sep('5. ESTRUTURA: subscriptions');
    const [subCols] = await conn.query('DESCRIBE subscriptions');
    printTable(subCols);

    // ── 6. ESTRUTURA: products ──────────────────────────────────────────────
    sep('6. ESTRUTURA: products');
    try {
      const [prodCols] = await conn.query('DESCRIBE products');
      printTable(prodCols);
    } catch (e) { console.log('  ⚠️  Tabela products não encontrada:', e.message); }

    // ── 7. ESTRUTURA: purchases ─────────────────────────────────────────────
    sep('7. ESTRUTURA: purchases');
    try {
      const [purCols] = await conn.query('DESCRIBE purchases');
      printTable(purCols);
    } catch (e) { console.log('  ⚠️  Tabela purchases não encontrada:', e.message); }

    // ── 8. RESUMO GERAL ─────────────────────────────────────────────────────
    sep('8. RESUMO GERAL: clients, subscriptions');
    const [summary] = await conn.query(`
      SELECT
        (SELECT COUNT(*) FROM people WHERE admin = 0) AS total_clients,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') AS active_subs,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'canceled') AS canceled_subs,
        (SELECT COUNT(*) FROM subscriptions WHERE status NOT IN ('active','canceled')) AS other_status
    `);
    printTable(summary);

    // ── 9. STATUS DISTINTOS em subscriptions ────────────────────────────────
    sep('9. STATUS DISTINTOS em subscriptions');
    const [subStatuses] = await conn.query(`
      SELECT status, COUNT(*) as count
      FROM subscriptions
      GROUP BY status
      ORDER BY count DESC
    `);
    printTable(subStatuses);

    // ── 10. PLANOS COM CONTAGEM DE ASSINANTES ───────────────────────────────
    sep('10. PLANOS × ASSINANTES (ativos vs total)');
    const [plansSubs] = await conn.query(`
      SELECT
        p.id, p.title, p.price, p.intervalType,
        COUNT(s.id) AS total_assinantes,
        SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) AS ativos,
        SUM(CASE WHEN s.status = 'canceled' THEN 1 ELSE 0 END) AS cancelados
      FROM plans p
      LEFT JOIN subscriptions s ON s.planId = p.id
      GROUP BY p.id, p.title, p.price, p.intervalType
      ORDER BY ativos DESC
    `);
    printTable(plansSubs);

    // ── 11. TIPOS DISTINTOS em products ─────────────────────────────────────
    sep('11. TIPOS DISTINTOS em products');
    try {
      const [prodTypes] = await conn.query(`
        SELECT type, COUNT(*) as count
        FROM products
        GROUP BY type
        ORDER BY count DESC
        LIMIT 30
      `);
      printTable(prodTypes);
    } catch (e) {
      // Talvez não tenha coluna 'type' — tenta name
      console.log('  ⚠️  Sem coluna type, tentando name...');
      try {
        const [prodNames] = await conn.query(`SELECT id, name, price FROM products LIMIT 30`);
        printTable(prodNames);
      } catch(e2) { console.log(' Erro:', e2.message); }
    }

    // ── 12. PRODUTOS DISTINTOS ───────────────────────────────────────────────
    sep('12. LISTA DE PRODUTOS');
    try {
      const [prods] = await conn.query(`SELECT * FROM products LIMIT 50`);
      printTable(prods);
    } catch (e) { console.log('  ⚠️', e.message); }

    // ── 13. CLIENTES: SÓ LIVROS (sem assinatura ativa de software) ─────────
    sep('13. CLIENTES COM COMPRA DE LIVROS — SEM ASSINATURA ATIVA');
    try {
      // Primeiro descobre quais produtos parecem ser livros
      const [bookProducts] = await conn.query(`
        SELECT DISTINCT pr.id, pr.name
        FROM products pr
        WHERE LOWER(pr.name) LIKE '%livro%'
           OR LOWER(pr.name) LIKE '%book%'
           OR LOWER(pr.name) LIKE '%ebook%'
        LIMIT 20
      `);
      console.log('  Produtos identificados como livros:');
      printTable(bookProducts);

      if (bookProducts.length > 0) {
        const bookIds = bookProducts.map(b => b.id).join(',');
        const [bookClients] = await conn.query(`
          SELECT DISTINCT
            pe.id, pe.fullName, pe.email, pe.phoneNumber,
            GROUP_CONCAT(DISTINCT pr.name SEPARATOR ' | ') AS livros_comprados
          FROM people pe
          INNER JOIN purchases pu ON pu.personId = pe.id AND pu.status = 'success'
          INNER JOIN purchase_items pi ON pi.purchaseId = pu.id
          INNER JOIN product_items pti ON pti.id = pi.productItemId
          INNER JOIN products pr ON pr.id = pti.productId
          WHERE pe.admin = 0
            AND pr.id IN (${bookIds})
            AND pe.id NOT IN (
              SELECT personId FROM subscriptions WHERE status = 'active'
            )
          GROUP BY pe.id, pe.fullName, pe.email, pe.phoneNumber
          ORDER BY pe.fullName
          LIMIT 200
        `);
        console.log(`\n  Total de clientes SOMENTE LIVROS (sem sub ativa): ${bookClients.length}`);
        printTable(bookClients);
      } else {
        console.log('  Nenhum produto com nome de livro encontrado. Listando todos os produtos:');
      }
    } catch (e) {
      console.log('  ⚠️  Erro na query de livros:', e.message);
    }

    // ── 14. CLIENTES COM ASSINATURA ATIVA (amostra) ─────────────────────────
    sep('14. CLIENTES COM ASSINATURA ATIVA — amostra 30 registros');
    const [activeSubs] = await conn.query(`
      SELECT
        pe.id, pe.fullName, pe.email, pe.phoneNumber,
        pl.title AS plano, pl.price AS valor, pl.intervalType,
        s.status, s.isValidUntil, s.createdAt AS inicio
      FROM people pe
      INNER JOIN subscriptions s ON s.personId = pe.id
      INNER JOIN plans pl ON pl.id = s.planId
      WHERE s.status = 'active' AND pe.admin = 0
      ORDER BY s.createdAt DESC
      LIMIT 30
    `);
    printTable(activeSubs);

    // ── 15. CLIENTES SEM ASSINATURA E SEM COMPRA (abandonados) ─────────────
    sep('15. CLIENTES CADASTRADOS MAS SEM ASSINATURA E SEM COMPRA');
    const [abandoned] = await conn.query(`
      SELECT pe.id, pe.fullName, pe.email, pe.phoneNumber, pe.createdAt
      FROM people pe
      WHERE pe.admin = 0
        AND pe.id NOT IN (SELECT DISTINCT personId FROM subscriptions)
        AND pe.id NOT IN (SELECT DISTINCT personId FROM purchases WHERE status = 'success')
      ORDER BY pe.createdAt DESC
      LIMIT 50
    `);
    console.log(`  Total cadastros abandonados (amostra 50): ${abandoned.length}`);
    printTable(abandoned);

    // ── 16. CLIENTES COM COMPRA MAS SEM ASSINATURA ATIVA ───────────────────
    sep('16. CLIENTES COM COMPRA MAS SEM ASSINATURA ATIVA (possíveis compradores de livros)');
    const [buyersNoSub] = await conn.query(`
      SELECT DISTINCT
        pe.id, pe.fullName, pe.email, pe.phoneNumber
      FROM people pe
      INNER JOIN purchases pu ON pu.personId = pe.id AND pu.status = 'success'
      WHERE pe.admin = 0
        AND pe.id NOT IN (
          SELECT personId FROM subscriptions WHERE status = 'active'
        )
      ORDER BY pe.fullName
      LIMIT 100
    `);
    console.log(`  Total (amostra 100): ${buyersNoSub.length}`);
    printTable(buyersNoSub);

    // ── CONTAGEM TOTAL ───────────────────────────────────────────────────────
    sep('CONTAGENS FINAIS');
    const [totals] = await conn.query(`
      SELECT
        (SELECT COUNT(*) FROM people WHERE admin=0) AS pessoas_totais,
        (SELECT COUNT(DISTINCT personId) FROM subscriptions WHERE status='active') AS pessoas_com_sub_ativa,
        (SELECT COUNT(*) FROM subscriptions WHERE status='active') AS total_assinaturas_ativas,
        (SELECT COUNT(*) FROM plans) AS total_planos,
        (SELECT COUNT(*) FROM products) AS total_produtos,
        (SELECT COUNT(*) FROM purchases WHERE status='success') AS compras_sucesso
    `);
    printTable(totals);

  } catch (err) {
    console.error('❌ Erro na análise:', err.message);
    console.error(err);
  } finally {
    if (conn) await conn.end();
    console.log('\n✅ Análise concluída.');
  }
}

run();
