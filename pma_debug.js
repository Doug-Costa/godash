/**
 * pma_debug.js
 * Diagnóstico: loga no phpMyAdmin, captura HTML do editor SQL
 * e tenta submeter UMA query simples, salvando screenshots e HTML
 */
const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE = 'http://187.77.48.78:8888';
const USER = 'xkey';
const PASS = 'xkey@2026*';
const DB   = 'dentalgo_production';

async function shot(page, name) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  console.log(`  📸 ${name}.png`);
}

async function main() {
  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    slowMo: 50,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Captura console do browser
  page.on('console', msg => console.log(`  [BROWSER ${msg.type()}] ${msg.text().slice(0, 120)}`));

  try {
    // LOGIN
    console.log('1. Login...');
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
    await shot(page, '01_login_page');

    // Inspeciona formulário
    const formInfo = await page.evaluate(() => {
      const inputs = [...document.querySelectorAll('input')].map(i => ({
        id: i.id, name: i.name, type: i.type, placeholder: i.placeholder
      }));
      const buttons = [...document.querySelectorAll('button, input[type="submit"]')].map(b => ({
        id: b.id, name: b.name || b.textContent?.trim(), type: b.type
      }));
      return { inputs, buttons };
    });
    console.log('  Formulário:', JSON.stringify(formInfo, null, 2));

    // Preenche login
    await page.focus('#input_username');
    await page.keyboard.type(USER);
    await page.focus('#input_password');
    await page.keyboard.type(PASS);
    await shot(page, '02_creds');

    // Submit
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
      page.click('#input_go'),
    ]);
    await shot(page, '03_after_login');
    console.log('  URL após login:', page.url());

    // Vai para SQL do banco
    console.log('\n2. Navegando para /database/sql...');
    await page.goto(
      `${BASE}/index.php?route=/database/sql&db=${encodeURIComponent(DB)}`,
      { waitUntil: 'networkidle2', timeout: 20000 }
    );
    await shot(page, '04_sql_page');

    // Inspeciona a página SQL
    const sqlPageInfo = await page.evaluate(() => {
      const cm = document.querySelector('.CodeMirror');
      const ta = document.querySelector('#sqlquery, textarea[name="sql_query"]');
      const buttons = [...document.querySelectorAll('button, input[type="submit"]')].map(b => ({
        id: b.id, name: b.name, value: b.value, text: b.textContent?.trim()?.slice(0,30), visible: b.offsetParent !== null
      }));
      return {
        hasCodeMirror: !!cm,
        cmHasInstance: cm ? !!cm.CodeMirror : false,
        hasTextarea: !!ta,
        taId: ta?.id,
        windowHasEditor: typeof window.codemirror_editor !== 'undefined',
        buttons,
        bodyClasses: document.body.className,
        title: document.title,
      };
    });
    console.log('\n  Página SQL info:');
    console.log(JSON.stringify(sqlPageInfo, null, 2));

    // Aguarda um pouco e re-verifica
    await new Promise(r => setTimeout(r, 2000));

    const cmCheck = await page.evaluate(() => {
      const cm = document.querySelector('.CodeMirror');
      return {
        hasInstance: cm ? !!cm.CodeMirror : false,
        windowEditor: typeof window.codemirror_editor !== 'undefined',
        // Tenta achar qualquer objeto CodeMirror no window
        cmKeys: Object.keys(window).filter(k => k.toLowerCase().includes('codemirror') || k.toLowerCase().includes('editor')),
      };
    });
    console.log('\n  CodeMirror check após 2s:', JSON.stringify(cmCheck));

    // Tenta setar SQL de várias formas
    console.log('\n3. Tentando setar SQL...');
    const TEST_SQL = 'SELECT 1 AS teste';

    const setResult = await page.evaluate((sql) => {
      const attempts = [];
      // Tentativa 1: window.codemirror_editor
      if (window.codemirror_editor) {
        window.codemirror_editor.setValue(sql);
        attempts.push('window.codemirror_editor OK');
      }
      // Tentativa 2: .CodeMirror.CodeMirror
      const cmEl = document.querySelector('.CodeMirror');
      if (cmEl && cmEl.CodeMirror) {
        cmEl.CodeMirror.setValue(sql);
        attempts.push('.CodeMirror.CodeMirror OK');
      }
      // Tentativa 3: textarea
      const ta = document.querySelector('#sqlquery') || document.querySelector('textarea[name="sql_query"]');
      if (ta) {
        ta.value = sql;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.dispatchEvent(new Event('change', { bubbles: true }));
        attempts.push(`textarea[#${ta.id}] OK`);
      }
      return attempts;
    }, TEST_SQL);
    console.log('  Set SQL result:', setResult);

    await shot(page, '05_sql_set');

    // Inspeciona todos os botões visíveis
    const allBtns = await page.evaluate(() => {
      return [...document.querySelectorAll('button, input[type="submit"], input[type="button"]')]
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        })
        .map(el => ({
          tag: el.tagName,
          id: el.id,
          name: el.getAttribute('name'),
          value: el.value,
          text: el.textContent?.trim()?.slice(0, 30),
          class: el.className?.slice(0, 50),
        }));
    });
    console.log('\n  Botões visíveis:');
    allBtns.forEach(b => console.log('  ', JSON.stringify(b)));

    // Tenta submeter via form diretamente
    console.log('\n4. Submetendo form...');
    const submitInfo = await page.evaluate(() => {
      const form = document.querySelector('form[name="sqlform"]') ||
                   document.querySelector('#sqlform') ||
                   [...document.querySelectorAll('form')].find(f => f.querySelector('#sqlquery, #sqlquery'));
      if (!form) return 'Nenhum form SQL encontrado';
      return { action: form.action, method: form.method, id: form.id, name: form.name };
    });
    console.log('  Form info:', submitInfo);

    // Salva HTML completo
    const html = await page.content();
    fs.writeFileSync('screenshots/sql_page.html', html, 'utf8');
    console.log('\n  HTML salvo em screenshots/sql_page.html');

    // Tenta click no botão Go
    const goBtn = await page.$('#button_submit_query');
    if (goBtn) {
      console.log('\n5. Clicando em #button_submit_query...');
      await shot(page, '06_before_go');
      await goBtn.click();
      console.log('  Click feito, aguardando 5s...');
      await new Promise(r => setTimeout(r, 5000));
      await shot(page, '07_after_go');
      const url = page.url();
      console.log('  URL após Go:', url);

      const hasResult = await page.evaluate(() => {
        const tables = document.querySelectorAll('table');
        return {
          tablesCount: tables.length,
          hasPmaTable: !!document.querySelector('.table_results, .resultdata'),
          pageText: document.body.innerText.slice(0, 200),
        };
      });
      console.log('  Resultado:', JSON.stringify(hasResult));
    } else {
      console.log('  ⚠️ #button_submit_query não encontrado — tentando form.submit()...');
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) form.submit();
      });
      await new Promise(r => setTimeout(r, 5000));
      await shot(page, '07_form_submit');
    }

  } finally {
    await browser.close();
    console.log('\n🔒 Pronto. Verifique screenshots/');
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
