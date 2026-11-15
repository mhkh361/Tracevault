const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const execPath = fs.existsSync(edgePath) ? edgePath : chromePath;

  const htmlPath = path.resolve(__dirname, '..', 'report', 'report_print.html');
  const pdfPath = path.resolve(__dirname, '..', 'report', 'tracevault_lab_report.pdf');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  console.log('Rendering PDF from:', fileUrl);
  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  await page.goto(fileUrl, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      bottom: '0mm',
      left: '0mm',
      right: '0mm'
    }
  });

  await browser.close();
  console.log('PDF Report compiled successfully at:', pdfPath);
})().catch(err => {
  console.error('PDF Generation Error:', err.message);
  process.exit(1);
});
