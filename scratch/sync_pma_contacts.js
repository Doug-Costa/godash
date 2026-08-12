const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = 'http://187.77.48.78:8888';
const USER = 'xkey';
const PASS = 'xkey@2026*';
const DB   = 'dentalgo_production';

async function main() {
  console.log('1. Connecting to phpMyAdmin at http://187.77.48.78:8888...');
  const browser = await puppeteer.launch({
    headless: true,
    protocolTimeout: 180000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.focus('#input_username');
    await page.keyboard.type(USER);
    await page.focus('#input_password');
    await page.keyboard.type(PASS);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
      page.click('#input_go'),
    ]);

    // Fetch incomplete customer externalPersonIds
    const incompleteCusts = await prisma.customer.findMany({
      where: { externalPersonId: { not: null } },
      select: { id: true, externalPersonId: true, metadata: true }
    });

    console.log(`Found ${incompleteCusts.length} total customers with externalPersonId in PostgreSQL.`);
    const extIds = Array.from(new Set(incompleteCusts.map(c => c.externalPersonId).filter(Boolean)));

    if (extIds.length === 0) {
      console.log('No externalPersonIds found to sync.');
      return;
    }

    console.log('2. Navigating to SQL editor in phpMyAdmin...');
    await page.goto(
      `${BASE}/index.php?route=/database/sql&db=${encodeURIComponent(DB)}`,
      { waitUntil: 'networkidle2', timeout: 30000 }
    );

    const QUERY_SQL = `
      SELECT 
        p.id,
        COALESCE(NULLIF(p.fullName, ''), NULLIF(p.name, ''), p.email) AS name,
        p.email,
        p.phoneNumber AS phone
      FROM people p
      WHERE p.id IN (${extIds.join(',')})
      LIMIT 1000
    `;

    console.log('3. Setting SQL query in phpMyAdmin...');
    await page.evaluate((sql) => {
      const ta = document.querySelector('#sqlquery') || document.querySelector('textarea[name="sql_query"]');
      if (ta) ta.value = sql;
      if (window.codemirror_editor) window.codemirror_editor.setValue(sql);
      const cmEl = document.querySelector('.CodeMirror');
      if (cmEl && cmEl.CodeMirror) cmEl.CodeMirror.setValue(sql);
    }, QUERY_SQL);

    console.log('4. Submitting query...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 40000 }),
      page.evaluate(() => {
        const form = document.querySelector('form[name="sqlform"]') || document.querySelector('#sqlform');
        if (form) form.submit();
      }),
    ]);

    console.log('5. Extracting rows from HTML table...');
    const parsedRows = await page.evaluate(() => {
      const table = document.querySelector('table.table_results, table.table-results, table.data, .table_results');
      if (!table) return [];

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      return rows.map(tr => {
        const tds = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        // Find cells containing ID, name, email, phone
        // In phpMyAdmin, action columns occupy index 0-3
        return {
          id: parseInt(tds[4] || tds[3] || '0', 10),
          name: tds[5] || '',
          email: tds[6] || '',
          phone: tds[7] || ''
        };
      }).filter(r => r.id > 0);
    });

    console.log(`Extracted ${parsedRows.length} rows from phpMyAdmin.`);
    console.log('Sample parsed row:', parsedRows[0]);

    if (parsedRows.length > 0) {
      const rowMap = new Map();
      for (const r of parsedRows) {
        rowMap.set(r.id, r);
      }

      let updatedCount = 0;
      for (const cust of incompleteCusts) {
        if (cust.externalPersonId && rowMap.has(cust.externalPersonId)) {
          const r = rowMap.get(cust.externalPersonId);
          const currentMeta = cust.metadata || {};

          const newMeta = {
            ...currentMeta,
            name: r.name || currentMeta.name || `Lead #${cust.externalPersonId}`,
            email: r.email || currentMeta.email || '',
            phone: r.phone || currentMeta.phone || ''
          };

          await prisma.customer.update({
            where: { id: cust.id },
            data: { metadata: newMeta }
          });
          updatedCount++;
        }
      }

      console.log(`✅ Successfully updated ${updatedCount} Customer metadata records in PostgreSQL!`);
    }

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main();
