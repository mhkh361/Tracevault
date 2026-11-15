const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const erSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" width="100%" height="100%" style="background-color: #ffffff; font-family: 'JetBrains Mono', 'Segoe UI', sans-serif;">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1" />
    </filter>
  </defs>

  <!-- Title -->
  <text x="450" y="32" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">TraceVault 3NF Relational Entity-Relationship (ER) Diagram</text>

  <!-- DOMAINS Entity Box -->
  <rect x="50" y="90" width="220" height="200" rx="8" fill="#f8fafc" stroke="#1e293b" stroke-width="2" filter="url(#shadow)" />
  <rect x="50" y="90" width="220" height="40" rx="8" fill="#1e293b" />
  <rect x="50" y="120" width="220" height="10" fill="#1e293b" />
  <text x="160" y="116" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">DOMAINS (Parent)</text>
  
  <text x="70" y="155" font-size="12" font-weight="bold" fill="#0284c7">PK  domain_id : INT</text>
  <line x1="65" y1="168" x2="255" y2="168" stroke="#e2e8f0" stroke-width="1" />
  <text x="70" y="190" font-size="12" fill="#334155">    domain_name : VARCHAR(50)</text>
  <text x="70" y="215" font-size="12" fill="#334155">    description : VARCHAR(255)</text>
  <text x="70" y="240" font-size="12" fill="#334155">    created_at : TIMESTAMP</text>
  <text x="70" y="270" font-size="11" font-style="italic" fill="#64748b">[InnoDB, UNIQUE name]</text>

  <!-- Relationship Diamond -->
  <polygon points="450,150 510,190 450,230 390,190" fill="#f1f5f9" stroke="#0284c7" stroke-width="2" filter="url(#shadow)" />
  <text x="450" y="188" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">categorizes</text>
  <text x="450" y="204" font-size="10" fill="#0284c7" text-anchor="middle">(1 : N)</text>

  <!-- Connection Lines with Cardinality -->
  <line x1="270" y1="190" x2="390" y2="190" stroke="#0f172a" stroke-width="2" />
  <text x="290" y="180" font-size="13" font-weight="bold" fill="#0f172a">1</text>
  <text x="285" y="205" font-size="10" fill="#64748b">Mandatory</text>

  <line x1="510" y1="190" x2="630" y2="190" stroke="#0f172a" stroke-width="2" />
  <text x="610" y="180" font-size="13" font-weight="bold" fill="#0f172a">N</text>
  <text x="590" y="205" font-size="10" fill="#64748b">Optional / Many</text>

  <!-- ERROR_LOGS Entity Box -->
  <rect x="630" y="60" width="230" height="270" rx="8" fill="#f8fafc" stroke="#1e293b" stroke-width="2" filter="url(#shadow)" />
  <rect x="630" y="60" width="230" height="40" rx="8" fill="#1e293b" />
  <rect x="630" y="90" width="230" height="10" fill="#1e293b" />
  <text x="745" y="86" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">ERROR_LOGS (Child)</text>

  <text x="645" y="125" font-size="12" font-weight="bold" fill="#0284c7">PK  error_id : INT</text>
  <text x="645" y="148" font-size="12" font-weight="bold" fill="#d97706">FK  domain_id : INT</text>
  <line x1="640" y1="160" x2="845" y2="160" stroke="#e2e8f0" stroke-width="1" />
  <text x="645" y="180" font-size="12" fill="#334155">    tech_stack : VARCHAR(100)</text>
  <text x="645" y="202" font-size="12" fill="#334155">    error_signature : VARCHAR(255)</text>
  <text x="645" y="224" font-size="12" fill="#334155">    signature_hash : CHAR(64) UQ</text>
  <text x="645" y="246" font-size="12" fill="#334155">    root_cause : TEXT</text>
  <text x="645" y="268" font-size="12" fill="#334155">    fix_requirements : TEXT</text>
  <text x="645" y="290" font-size="12" fill="#334155">    times_hit : INT (CHECK &gt;= 1)</text>
  <text x="645" y="312" font-size="12" fill="#334155">    is_verified : TINYINT(1)</text>

  <!-- Footnote -->
  <text x="450" y="360" font-size="11" fill="#64748b" text-anchor="middle">FK Constraint: ON UPDATE CASCADE, ON DELETE RESTRICT | Deduplication: SHA-256 UNIQUE Key</text>
</svg>
`;

const outDir = path.join(__dirname, '..', 'report', 'screenshots');
fs.writeFileSync(path.join(outDir, '00_er_diagram.svg'), erSvg);
console.log('Saved 00_er_diagram.svg');

(async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const execPath = fs.existsSync(edgePath) ? edgePath : chromePath;

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 950, height: 420, deviceScaleFactor: 2 });
  await page.setContent(erSvg);
  await page.screenshot({ path: path.join(outDir, '00_er_diagram.png'), omitBackground: false });
  console.log('Saved 00_er_diagram.png');
  await browser.close();
})().catch(console.error);
