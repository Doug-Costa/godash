const puppeteer = require('puppeteer');

const BASE = 'http://187.77.48.78:8888';
const USER = 'xkey';
const PASS = 'xkey@2026*';
const DB   = 'dentalgo_production';

async function executeSql(sql) {
  const browser = await puppeteer.launch({
    headless: true,
    protocolTimeout: 60000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 20000 });
    await page.focus('#input_username');
    await page.keyboard.type(USER);
    await page.focus('#input_password');
    await page.keyboard.type(PASS);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
      page.click('#input_go'),
    ]);

    await page.goto(
      `${BASE}/index.php?route=/database/sql&db=${encodeURIComponent(DB)}`,
      { waitUntil: 'networkidle2', timeout: 20000 }
    );

    // Format SQL query to output JSON
    const jsonSql = `SELECT JSON_ARRAYAGG(JSON_OBJECT('id', p.id, 'fullName', p.fullName, 'email', p.email, 'phoneNumber', p.phoneNumber)) AS json_result FROM (${sql}) p;`;

    await page.evaluate((s) => {
      const ta = document.querySelector('#sqlquery') || document.querySelector('textarea[name="sql_query"]');
      if (ta) ta.value = s;
      if (window.codemirror_editor) window.codemirror_editor.setValue(s);
      const cmEl = document.querySelector('.CodeMirror');
      if (cmEl && cmEl.CodeMirror) cmEl.CodeMirror.setValue(s);
    }, jsonSql);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.evaluate(() => {
        const form = document.querySelector('form[name="sqlform"]') || document.querySelector('#sqlform');
        if (form) form.submit();
      }),
    ]);

    const jsonText = await page.evaluate(() => {
      const td = document.querySelector('table.table_results tbody tr td.data, table.table_results tbody tr td:last-child, td.pre');
      return td ? td.innerText : null;
    });

    console.log('Raw JSON from phpMyAdmin:');
    console.log(jsonText ? jsonText.slice(0, 300) : 'null');
    return jsonText ? JSON.parse(jsonText) : [];
  } catch (err) {
    console.error('Error:', err.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function run() {
  const data = await executeSql('SELECT id, fullName, email, phoneNumber FROM people WHERE id IN (7509, 8589, 39462, 39428, 39378)');
  console.log('Parsed Rows:', JSON.stringify(data, null, 2));
}

run();
