const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const execPath = fs.existsSync(edgePath) ? edgePath : chromePath;

  const outDir = path.join(__dirname, '..', 'report', 'screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  const publicHtml = path.resolve(__dirname, '..', 'public', 'index.html');
  const fileUrl = 'file:///' + publicHtml.replace(/\\/g, '/');

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(fileUrl, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));

  // 1. Inventory Overview
  await page.screenshot({ path: path.join(outDir, '01_inventory_overview.png') });
  console.log('Saved 01_inventory_overview.png');

  // 2. Search & Filter
  await page.type('#search-input', 'MySQL');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '02_search_filter.png') });
  console.log('Saved 02_search_filter.png');

  // Reset search
  await page.click('#clear-filter-btn');
  await new Promise(r => setTimeout(r, 400));

  // 3. Edit Dialog Modal
  await page.evaluate(() => {
    const btn = document.querySelector('.btn-edit');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '03_edit_modal.png') });
  console.log('Saved 03_edit_modal.png');

  // Close modal
  await page.click('#edit-cancel-btn');
  await new Promise(r => setTimeout(r, 400));

  // 4. Alt+L AI Diagnostic Workbench
  await page.click('#tab-live-fixer');
  await new Promise(r => setTimeout(r, 500));
  await page.click('[data-preset="mysql"]');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '04_ai_diagnostic_workbench.png') });
  console.log('Saved 04_ai_diagnostic_workbench.png');

  await browser.close();
  console.log('All 4 screenshots captured successfully!');
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
