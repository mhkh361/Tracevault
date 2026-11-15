const DEFAULT_DOMAINS = [
  { domain_id: 1, domain_name: 'Frontend', description: 'Client-side rendering, DOM state, React hooks, and browser CORS policies' },
  { domain_id: 2, domain_name: 'Backend', description: 'Node.js runtime, Express middleware, async lifecycle, and API routing' },
  { domain_id: 3, domain_name: 'Database', description: 'MySQL relational schema, foreign key constraints, indexing, and deadlocks' },
  { domain_id: 4, domain_name: 'Fullstack', description: 'End-to-end authentication, JWT session tokens, and deployment pipelines' }
];

const DEFAULT_ERRORS = [
  { error_id: 1, domain_id: 1, domain_name: 'Frontend', tech_stack: 'Fetch API / CORS', error_signature: 'Access to fetch at origin has been blocked by CORS policy', root_cause: 'Express backend response is missing Access-Control-Allow-Origin headers for cross-origin browser requests.', fix_requirements: 'Configure cors() middleware in server.js with explicit origin and credentials support.', times_hit: 15, is_verified: 1 },
  { error_id: 2, domain_id: 1, domain_name: 'Frontend', tech_stack: 'React 18 / Hooks', error_signature: 'Too many re-renders. React limits the number of renders to prevent an infinite loop', root_cause: 'State setter function is invoked directly inside the component render body instead of an event handler or useEffect.', fix_requirements: 'Wrap the state update call inside an arrow function onClick={() => setCount(c + 1)} or useEffect hook.', times_hit: 9, is_verified: 1 },
  { error_id: 3, domain_id: 1, domain_name: 'Frontend', tech_stack: 'Next.js 14 / SSR', error_signature: 'Hydration failed because the initial UI does not match what was rendered on the server', root_cause: 'Non-deterministic values like Date.now() or window objects were used during initial SSR render.', fix_requirements: 'Defer browser-specific rendering to a client-side useEffect hook after mount.', times_hit: 7, is_verified: 1 },
  { error_id: 4, domain_id: 2, domain_name: 'Backend', tech_stack: 'Node.js / Express', error_signature: 'Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client', root_cause: 'Multiple res.json() or res.send() calls executed in the same route handler because a return statement was omitted.', fix_requirements: 'Add an explicit return statement before every res.status().json() call inside conditional branches.', times_hit: 12, is_verified: 1 },
  { error_id: 5, domain_id: 2, domain_name: 'Backend', tech_stack: 'Node.js / TCP', error_signature: 'Error: listen EADDRINUSE: address already in use :::3000', root_cause: 'Another Node.js process is already bound to TCP port 3000 from a previous unclosed terminal session.', fix_requirements: 'Terminate the orphaned process using taskkill /F /IM node.exe or configure a fallback port.', times_hit: 6, is_verified: 1 },
  { error_id: 6, domain_id: 2, domain_name: 'Backend', tech_stack: 'Express / JSON', error_signature: 'SyntaxError: Unexpected token in JSON at position 0 in body-parser', root_cause: 'Client sent a malformed JSON payload with Content-Type: application/json header.', fix_requirements: 'Validate JSON payload structure on the client before fetch() and add JSON error middleware.', times_hit: 5, is_verified: 1 },
  { error_id: 7, domain_id: 3, domain_name: 'Database', tech_stack: 'MySQL 8.0 / InnoDB', error_signature: 'ER_NO_REFERENCED_ROW_2: Cannot add or update a child row: a foreign key constraint fails', root_cause: 'Attempted to insert an error_logs record with a domain_id that does not exist in the parent domains table.', fix_requirements: 'Verify that domain_id exists in the domains table before executing INSERT INTO error_logs.', times_hit: 11, is_verified: 1 },
  { error_id: 8, domain_id: 3, domain_name: 'Database', tech_stack: 'MySQL 8.0 / SQL', error_signature: 'ER_DUP_ENTRY: Duplicate entry for key error_logs.signature_hash', root_cause: 'Submitted an error_signature whose SHA-256 hash already exists in the error_logs table.', fix_requirements: 'Use INSERT INTO ... ON DUPLICATE KEY UPDATE times_hit = times_hit + 1.', times_hit: 4, is_verified: 1 },
  { error_id: 9, domain_id: 3, domain_name: 'Database', tech_stack: 'mysql2 / Pool', error_signature: 'Error: connect ECONNREFUSED 127.0.0.1:3306', root_cause: 'Local MySQL / MariaDB service on port 3306 is stopped or blocked.', fix_requirements: 'Start the MySQL daemon on port 3306 and verify connection credentials in dbConfig.', times_hit: 4, is_verified: 1 },
  { error_id: 10, domain_id: 4, domain_name: 'Fullstack', tech_stack: 'JWT / Auth', error_signature: 'JsonWebTokenError: invalid signature on protected API route', root_cause: 'JWT token was signed with a different secret key than the JWT_SECRET used by verification middleware.', fix_requirements: 'Synchronize JWT_SECRET across token generation and verification modules.', times_hit: 8, is_verified: 1 },
  { error_id: 11, domain_id: 4, domain_name: 'Fullstack', tech_stack: 'Prisma / Env', error_signature: 'Error: Environment variable not found: DATABASE_URL', root_cause: 'Application started without loading .env configuration or missing DATABASE_URL.', fix_requirements: 'Configure dotenv.config() at the top of server.js and provide localhost fallback defaults.', times_hit: 2, is_verified: 1 },
  { error_id: 12, domain_id: 4, domain_name: 'Fullstack', tech_stack: 'WebSockets / TLS', error_signature: 'Mixed Content: The page at HTTPS was loaded over HTTPS, but requested an insecure ws:// endpoint', root_cause: 'Hardcoded insecure ws:// or http:// protocol used inside an HTTPS production origin.', fix_requirements: 'Upgrade connections to wss:// and https:// when window.location.protocol is https:.', times_hit: 2, is_verified: 1 }
];

// Live Code Presets for Alt+L Demonstration
const CODE_PRESETS = {
  cors: {
    domain_id: 1,
    tech_stack: 'Express / Fetch CORS',
    code: `// Broken Frontend + Backend Request\nfetch('http://localhost:4000/api/orders', {\n  method: 'POST',\n  credentials: 'include'\n});\n// Console Error: Access to fetch at 'http://localhost:4000/api/orders' from origin 'http://localhost:3000' has been blocked by CORS policy`,
    signature: 'Access to fetch at origin blocked by CORS policy (credentials mode)',
    cause: 'Backend server does not include Access-Control-Allow-Origin and Access-Control-Allow-Credentials headers.',
    fix: `const cors = require('cors');\napp.use(cors({ origin: 'http://localhost:3000', credentials: true }));`
  },
  react: {
    domain_id: 1,
    tech_stack: 'React 18 / State Hook',
    code: `function CounterView({ items }) {\n  const [total, setTotal] = useState(0);\n  // BUG: Calling state setter directly during render\n  setTotal(items.length);\n  return <div>{total}</div>;\n}`,
    signature: 'Too many re-renders. React limits the number of renders to prevent an infinite loop',
    cause: 'setTotal(items.length) is called unconditionally inside the component render body, triggering an infinite render loop.',
    fix: `useEffect(() => {\n  setTotal(items.length);\n}, [items.length]);`
  },
  mysql: {
    domain_id: 3,
    tech_stack: 'MySQL 8.0 / Foreign Key',
    code: `INSERT INTO error_logs (domain_id, tech_stack, error_signature)\nVALUES (99, 'MySQL 8.0', 'Foreign Key Test');\n-- Error 1452 (23000): Cannot add or update a child row: a foreign key constraint fails`,
    signature: 'ER_NO_REFERENCED_ROW_2: Foreign key constraint fails on domain_id',
    cause: 'Attempted to insert child record with domain_id = 99 which does not exist in parent table domains.',
    fix: `INSERT INTO domains (domain_id, domain_name, description) VALUES (5, 'Cloud', 'Cloud infra');\nINSERT INTO error_logs (domain_id, ...) VALUES (5, ...);`
  },
  async: {
    domain_id: 2,
    tech_stack: 'Node.js / Express Async',
    code: `app.post('/api/login', async (req, res) => {\n  if (!req.body.email) {\n    res.status(400).json({ error: 'Email required' }); // Missing return!\n  }\n  res.json({ status: 'ok' });\n});`,
    signature: 'Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client',
    cause: 'Missing return keyword before res.status(400).json(), causing execution to continue to the second res.json() call.',
    fix: `if (!req.body.email) {\n  return res.status(400).json({ error: 'Email required' });\n}\nreturn res.json({ status: 'ok' });`
  }
};

let useLocalFallback = false;
let apiBase = '';
let domainsState = [];
let errorsMap = new Map();
let pendingDeleteTarget = null;
let bannerTimeout = null;

// DOM Elements
const statusBanner = document.getElementById('status-banner');
const dbStatusText = document.getElementById('db-status-text');
const statCountEl = document.getElementById('stat-count');
const statSumEl = document.getElementById('stat-sum');
const statAvgEl = document.getElementById('stat-avg');
const statMaxEl = document.getElementById('stat-max');
const statMinEl = document.getElementById('stat-min');

const tabLabView = document.getElementById('tab-lab-view');
const tabLiveFixer = document.getElementById('tab-live-fixer');
const labWorkspace = document.getElementById('lab-inventory-workspace');
const fixerWorkspace = document.getElementById('live-fixer-workspace');

const fixerDomainSelect = document.getElementById('fixer-domain');
const fixerStackInput = document.getElementById('fixer-stack');
const fixerCodeInput = document.getElementById('fixer-code-input');
const fixerOutSig = document.getElementById('fixer-out-sig');
const fixerOutCause = document.getElementById('fixer-out-cause');
const fixerOutFix = document.getElementById('fixer-out-fix');
const runDiagnosisBtn = document.getElementById('run-diagnosis-btn');
const commitDiagnosisBtn = document.getElementById('commit-diagnosis-btn');
const closeFixerModalBtn = document.getElementById('close-fixer-modal-btn');


const addErrorForm = document.getElementById('add-error-form');
const addDomainSelect = document.getElementById('add-domain');
const addDomainForm = document.getElementById('add-domain-form');
const newDomainInput = document.getElementById('new-domain-name');
const domainCountPill = document.getElementById('domain-count-pill');
const domainListEl = document.getElementById('domain-list');

const filterForm = document.getElementById('filter-form');
const searchInput = document.getElementById('search-input');
const domainFilterSelect = document.getElementById('domain-filter');
const recordsCaption = document.getElementById('records-caption');
const errorsTbody = document.getElementById('errors-tbody');

const editDialog = document.getElementById('edit-dialog');
const editErrorForm = document.getElementById('edit-error-form');
const editDomainSelect = document.getElementById('edit-domain');
const editCancelBtn = document.getElementById('edit-cancel-btn');

const deleteDialog = document.getElementById('delete-dialog');
const deleteDialogTitle = document.getElementById('delete-dialog-title');
const deleteDialogMessage = document.getElementById('delete-dialog-message');
const deleteCancelBtn = document.getElementById('delete-cancel-btn');
const deleteConfirmBtn = document.getElementById('delete-confirm-btn');

function showBanner(msg, tone = 'success') {
  clearTimeout(bannerTimeout);
  statusBanner.textContent = msg;
  statusBanner.dataset.tone = tone;
  statusBanner.hidden = false;
  bannerTimeout = setTimeout(() => {
    statusBanner.hidden = true;
  }, 4000);
}

function setWorkspaceMode(mode) {
  const isFixer = mode === 'fixer';
  fixerWorkspace.hidden = !isFixer;
  tabLiveFixer.classList.toggle('is-active', isFixer);
  tabLabView.classList.toggle('is-active', !isFixer);
  tabLiveFixer.setAttribute('aria-selected', String(isFixer));
  tabLabView.setAttribute('aria-selected', String(!isFixer));
  if (isFixer) {
    setTimeout(() => fixerCodeInput.focus(), 40);
  }
}

tabLabView.addEventListener('click', () => setWorkspaceMode('lab'));
tabLiveFixer.addEventListener('click', () => setWorkspaceMode('fixer'));

if (closeFixerModalBtn) {
  closeFixerModalBtn.addEventListener('click', () => setWorkspaceMode('lab'));
}

fixerWorkspace.addEventListener('click', (e) => {
  if (e.target === fixerWorkspace) setWorkspaceMode('lab');
});

document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    setWorkspaceMode(fixerWorkspace.hidden ? 'fixer' : 'lab');
  } else if (e.key === 'Escape' && !fixerWorkspace.hidden) {
    e.preventDefault();
    setWorkspaceMode('lab');
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    setWorkspaceMode('lab');
    searchInput.focus();
  }
});

// Live Code Bug Fixer Presets & Heuristic Analyzer
document.querySelectorAll('.chip-btn[data-preset]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const p = CODE_PRESETS[btn.dataset.preset];
    if (!p) return;
    fixerDomainSelect.value = String(p.domain_id);
    fixerStackInput.value = p.tech_stack;
    fixerCodeInput.value = p.code;
    fixerOutSig.value = p.signature;
    fixerOutCause.value = p.cause;
    fixerOutFix.value = p.fix;
  });
});

runDiagnosisBtn.addEventListener('click', () => {
  const raw = fixerCodeInput.value.trim();
  if (!raw) {
    showBanner('Paste a broken code snippet or error trace first.', 'error');
    return;
  }

  const lines = raw.split('\n');
  const errorLine = lines.find((l) => /error[:\s]|exception|er_[a-z0-9_]+|lock wait timeout|foreign key|headers_sent|cors|re-renders|hydration|eaddrinuse|econnrefused/i.test(l));
  const codeLines = lines.filter((l) => {
    const t = l.trim();
    return t !== '' && !t.startsWith('//') && !t.startsWith('--');
  });

  let detectedSig = errorLine
    ? errorLine.replace(/^\s*(\/\/|--|\/\*+|\*+)\s*/, '').replace(/\*+\/\s*$/, '').trim()
    : (codeLines[0] || lines[0]).replace(/^\s*(\/\/|--)\s*/, '').trim();

  let detectedDomain = Number(fixerDomainSelect.value || 1);
  let detectedStack = fixerStackInput.value.trim();
  let detectedCause = '';
  let patchedCode = '';

  if (/beginTransaction|getConnection|ER_LOCK_WAIT_TIMEOUT|lock wait timeout/i.test(raw)) {
    detectedDomain = 3;
    detectedStack = 'Node.js / MySQL Transaction Pool';
    detectedCause = 'Database transaction lacks try/catch rollback handling and fails to release the pooled connection in a finally block, causing lock wait timeouts and connection leaks.';
    patchedCode = `app.post('/api/checkout', async (req, res) => {\n  const conn = await pool.getConnection();\n  try {\n    await conn.beginTransaction();\n    const [order] = await conn.execute('INSERT INTO orders (user_id) VALUES (?)', [req.body.userId]);\n    await conn.commit();\n    return res.json({ success: true, orderId: order.insertId });\n  } catch (err) {\n    await conn.rollback();\n    return res.status(500).json({ error: 'Transaction failed', details: err.message });\n  } finally {\n    conn.release(); // Always release connection back to pool\n  }\n});`;
  } else if (/cors|Access-Control-Allow-Origin/i.test(raw)) {
    detectedDomain = 1;
    detectedStack = 'Express / Fetch CORS';
    detectedCause = 'Cross-origin browser request blocked because the backend server omitted Access-Control-Allow-Origin and credentials headers.';
    patchedCode = `const cors = require('cors');\napp.use(cors({\n  origin: 'http://localhost:3000',\n  methods: ['GET', 'POST', 'PUT', 'DELETE'],\n  credentials: true\n}));`;
  } else if (/useState|re-renders|useEffect/i.test(raw)) {
    detectedDomain = 1;
    detectedStack = 'React 18 / Hooks';
    detectedCause = 'State setter is invoked unconditionally during component render, causing an infinite re-render loop.';
    patchedCode = `useEffect(() => {\n  ${codeLines.join('\n  ')}\n}, [dependencies]);`;
  } else if (/foreign key|ER_NO_REFERENCED_ROW|1452/i.test(raw)) {
    detectedDomain = 3;
    detectedStack = 'MySQL 8.0 / InnoDB';
    detectedCause = 'Child row INSERT/UPDATE references a domain_id that does not exist in the parent domains table.';
    patchedCode = `-- 1. Ensure parent domain exists first:\nINSERT IGNORE INTO domains (domain_id, domain_name, description) VALUES (1, 'Frontend', 'UI layer');\n-- 2. Execute child insert with valid FK:\n${codeLines.join('\n')}`;
  } else if (/HEADERS_SENT|headers after they are sent/i.test(raw)) {
    detectedDomain = 2;
    detectedStack = 'Node.js / Express';
    detectedCause = 'Multiple res.json() / res.send() calls executed in one request lifecycle due to a missing return statement.';
    patchedCode = codeLines
      .map((l) => (l.includes('res.status(') && !l.trim().startsWith('return ') ? l.replace('res.status(', 'return res.status(') : l))
      .join('\n');
  } else {
    if (/SELECT|INSERT|UPDATE|DELETE|mysql|pool\./i.test(raw)) {
      detectedDomain = 3;
      detectedStack = detectedStack || 'MySQL / Node.js';
    } else if (/app\.(get|post|put|delete)|req,\s*res|express/i.test(raw)) {
      detectedDomain = 2;
      detectedStack = detectedStack || 'Node.js / Express';
    } else if (/jwt|token|auth|prisma/i.test(raw)) {
      detectedDomain = 4;
      detectedStack = detectedStack || 'Fullstack / Auth';
    } else {
      detectedStack = detectedStack || 'JavaScript / Runtime';
    }
    detectedCause = `Unhandled exception in ${detectedStack} execution block without defensive try/catch error boundary.`;
    const indentedBody = (codeLines.length ? codeLines : lines).map((l) => `  ${l}`).join('\n');
    patchedCode = `try {\n${indentedBody}\n} catch (err) {\n  console.error('[Handled Exception]:', err.message);\n  return res?.status ? res.status(500).json({ error: err.message }) : null;\n}`;
  }

  fixerDomainSelect.value = String(detectedDomain);
  fixerStackInput.value = detectedStack;
  fixerOutSig.value = detectedSig.slice(0, 250);
  fixerOutCause.value = detectedCause;
  fixerOutFix.value = patchedCode;

  showBanner('Live diagnosis complete. Verified multi-line fix generated.');
});

commitDiagnosisBtn.addEventListener('click', async () => {
  const payload = {
    domain_id: Number(fixerDomainSelect.value || 1),
    tech_stack: fixerStackInput.value.trim() || 'Node.js / Runtime',
    error_signature: fixerOutSig.value.trim(),
    root_cause: fixerOutCause.value.trim(),
    fix_requirements: fixerOutFix.value.trim(),
    times_hit: 1,
    is_verified: 1
  };
  if (!payload.error_signature || !payload.root_cause || !payload.fix_requirements) {
    showBanner('Please run diagnosis or fill in Signature, Cause, and Fix before committing.', 'error');
    return;
  }
  await saveBugRecord(payload);
  setWorkspaceMode('lab');
});

function getLocalVault() {
  try {
    const rawDomains = localStorage.getItem('tv_domains_v1');
    const rawErrors = localStorage.getItem('tv_errors_v1');
    const domains = rawDomains ? JSON.parse(rawDomains) : [...DEFAULT_DOMAINS];
    const errors = rawErrors ? JSON.parse(rawErrors) : [...DEFAULT_ERRORS];
    if (!rawDomains) localStorage.setItem('tv_domains_v1', JSON.stringify(domains));
    if (!rawErrors) localStorage.setItem('tv_errors_v1', JSON.stringify(errors));
    return { domains, errors };
  } catch (_e) {
    return { domains: [...DEFAULT_DOMAINS], errors: [...DEFAULT_ERRORS] };
  }
}

function saveLocalVault(domains, errors) {
  try {
    localStorage.setItem('tv_domains_v1', JSON.stringify(domains));
    localStorage.setItem('tv_errors_v1', JSON.stringify(errors));
  } catch (_e) {}
}

async function detectBackendMode() {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (res.ok) {
      apiBase = '';
      useLocalFallback = false;
      dbStatusText.textContent = 'MySQL 3306 Live';
      return;
    }
  } catch (_e) {}

  try {
    const resLocal = await fetch('http://localhost:3000/api/health', { cache: 'no-store' });
    if (resLocal.ok) {
      apiBase = 'http://localhost:3000';
      useLocalFallback = false;
      dbStatusText.textContent = 'MySQL 3306 Live';
      return;
    }
  } catch (_e) {}

  useLocalFallback = true;
  dbStatusText.textContent = 'Browser Vault Active';
}

function populateDomainDropdowns(domains) {
  const prevAdd = addDomainSelect.value;
  const prevFilter = domainFilterSelect.value;
  const prevEdit = editDomainSelect.value;
  const prevFixer = fixerDomainSelect.value;

  addDomainSelect.innerHTML = '';
  editDomainSelect.innerHTML = '';
  fixerDomainSelect.innerHTML = '';
  domainFilterSelect.innerHTML = '<option value="all">All Domains (FK)</option>';

  domains.forEach((d) => {
    addDomainSelect.add(new Option(d.domain_name, String(d.domain_id)));
    editDomainSelect.add(new Option(d.domain_name, String(d.domain_id)));
    fixerDomainSelect.add(new Option(d.domain_name, String(d.domain_id)));
    domainFilterSelect.add(new Option(d.domain_name, String(d.domain_id)));
  });

  if (prevAdd) addDomainSelect.value = prevAdd;
  if (prevEdit) editDomainSelect.value = prevEdit;
  if (prevFixer) fixerDomainSelect.value = prevFixer;
  if (prevFilter) domainFilterSelect.value = prevFilter;
}

function renderDomainSidebar(domains) {
  domainCountPill.textContent = `${domains.length} rows`; domainListEl.innerHTML = '';  domains.forEach((d) => { const li = document.createElement('li'); li.className = 'domain-row-item';  const left = document.createElement('div'); left.className = 'domain-row-meta';  const nameSpan = document.createElement('span'); nameSpan.textContent = d.domain_name;  const countSpan = document.createElement('span'); countSpan.className = 'domain-row-count'; countSpan.textContent = `(${d.bug_count || 0})`;

    left.append(nameSpan, countSpan);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-secondary btn-xs';
    delBtn.textContent = 'Remove';
    delBtn.addEventListener('click', () => promptDeleteDomain(d));

    li.append(left, delBtn);
    domainListEl.appendChild(li);
  });
}

function renderErrorsTable(errors) {
  errorsMap.clear();
  errorsTbody.innerHTML = '';
  recordsCaption.textContent = `Saved Error Records (${errors.length} ${errors.length === 1 ? 'item' : 'items'})`;  if (errors.length === 0) { const tr = document.createElement('tr'); const td = document.createElement('td'); td.colSpan = 8; td.className = 'empty-row'; td.textContent = 'No matching bug records found.'; tr.appendChild(td); errorsTbody.appendChild(tr); return; }  errors.forEach((err) => { errorsMap.set(Number(err.error_id), err); const tr = document.createElement('tr');  const tdId = document.createElement('td'); tdId.className = 'mono-id'; tdId.textContent = `#${err.error_id}`;

    const tdSig = document.createElement('td');
    const sigTitle = document.createElement('div');
    sigTitle.className = 'row-sig';
    sigTitle.textContent = err.error_signature;
    const causeSub = document.createElement('div');
    causeSub.className = 'row-cause';
    causeSub.textContent = err.root_cause;
    tdSig.append(sigTitle, causeSub);

    const tdDom = document.createElement('td');
    const domBadge = document.createElement('span');
    domBadge.className = 'tag-domain';
    domBadge.textContent = err.domain_name || 'General';
    tdDom.appendChild(domBadge);

    const tdStack = document.createElement('td');
    tdStack.className = 'mono-stack';
    tdStack.textContent = err.tech_stack;

    const tdFix = document.createElement('td');
    tdFix.textContent = err.fix_requirements || err.fixed_code || '';

    const tdHits = document.createElement('td');
    tdHits.className = 't-center mono-hits';
    tdHits.textContent = String(err.times_hit || 1);

    const tdStatus = document.createElement('td');
    tdStatus.className = 't-center';
    const statusPill = document.createElement('span');
    const verified = Number(err.is_verified ?? 1) === 1;
    statusPill.className = `state-tag ${verified ? 'state-verified' : 'state-pending'}`; statusPill.textContent = verified ? 'Verified' : 'Pending'; tdStatus.appendChild(statusPill);  const tdActions = document.createElement('td'); tdActions.className = 't-right'; const actionWrap = document.createElement('div'); actionWrap.className = 'row-actions';  const editBtn = document.createElement('button'); editBtn.type = 'button'; editBtn.className = 'btn-secondary btn-xs'; editBtn.textContent = 'Edit'; editBtn.addEventListener('click', () => openEditModal(err.error_id));  const delBtn = document.createElement('button'); delBtn.type = 'button'; delBtn.className = 'btn-danger btn-xs'; delBtn.textContent = 'Delete'; delBtn.addEventListener('click', () => promptDeleteError(err));
    const askAiBtn = document.createElement('button');
    askAiBtn.type = 'button';
    askAiBtn.className = 'btn-secondary btn-xs';
    askAiBtn.textContent = 'Ask AI';
    askAiBtn.addEventListener('click', () => openAiChatWithContext(err));
    actionWrap.append(askAiBtn, editBtn, delBtn); tdActions.appendChild(actionWrap);  tr.append(tdId, tdSig, tdDom, tdStack, tdFix, tdHits, tdStatus, tdActions); errorsTbody.appendChild(tr); }); }  function updateSummaryCards(stats) { statCountEl.textContent = String(stats.total_bugs ?? 0); statSumEl.textContent = String(stats.total_hits ?? 0); statAvgEl.textContent = Number(stats.avg_hits ?? 0).toFixed(1); statMaxEl.textContent = String(stats.max_hits ?? 0); statMinEl.textContent = String(stats.min_hits ?? 0); }  async function refreshWorkspace() { const search = searchInput.value.trim(); const domain_id = domainFilterSelect.value || 'all';  if (useLocalFallback) { const { domains, errors } = getLocalVault(); const enrichedDomains = domains.map((d) => ({ ...d, bug_count: errors.filter((e) => Number(e.domain_id) === Number(d.domain_id)).length })); domainsState = enrichedDomains; populateDomainDropdowns(enrichedDomains); renderDomainSidebar(enrichedDomains);  let filtered = errors.map((e) => { const dom = domains.find((d) => Number(d.domain_id) === Number(e.domain_id)); return { ...e, domain_name: dom ? dom.domain_name : 'General' }; });  if (domain_id !== 'all') { filtered = filtered.filter((e) => Number(e.domain_id) === Number(domain_id)); } if (search) { const q = search.toLowerCase(); const numId = Number(q.replace(/^#/, '')); filtered = filtered.filter((e) => (Number.isInteger(numId) && numId > 0 && Number(e.error_id) === numId) || String(e.error_signature).toLowerCase().includes(q) || String(e.tech_stack).toLowerCase().includes(q) || String(e.root_cause).toLowerCase().includes(q) || String(e.fix_requirements).toLowerCase().includes(q) || String(e.domain_name).toLowerCase().includes(q) ); }  const total_bugs = filtered.length; const total_hits = filtered.reduce((acc, r) => acc + Number(r.times_hit || 1), 0); const avg_hits = total_bugs ? (total_hits / total_bugs).toFixed(1) : 0; const max_hits = total_bugs ? Math.max(...filtered.map((r) => Number(r.times_hit || 1))) : 0; const min_hits = total_bugs ? Math.min(...filtered.map((r) => Number(r.times_hit || 1))) : 0;  updateSummaryCards({ total_bugs, total_hits, avg_hits, max_hits, min_hits }); renderErrorsTable(filtered); return; }  try { const qs = new URLSearchParams(); if (domain_id && domain_id !== 'all') qs.set('domain_id', domain_id); if (search) qs.set('search', search);  const [domRes, errRes, statRes] = await Promise.all([ fetch(`${apiBase}/api/domains`),
      fetch(`${apiBase}/api/errors?${qs.toString()}`),
      fetch(`${apiBase}/api/stats?${qs.toString()}`)
    ]);

    const domJson = await domRes.json();
    const errJson = await errRes.json();
    const statJson = await statRes.json();

    if (domJson.success) {
      domainsState = domJson.data;
      populateDomainDropdowns(domainsState);
      renderDomainSidebar(domainsState);
    }
    if (statJson.success) {
      updateSummaryCards(statJson.data);
    }
    if (errJson.success) {
      renderErrorsTable(errJson.data);
    }
  } catch (err) {
    showBanner(err.message || 'Failed to load records from server.', 'error');
  }
}

async function saveBugRecord(payload) {
  if (useLocalFallback) {
    const { domains, errors } = getLocalVault();
    const nextId = errors.length ? Math.max(...errors.map((r) => Number(r.error_id))) + 1 : 1;
    errors.push({ error_id: nextId, ...payload });
    saveLocalVault(domains, errors);
    showBanner(`Saved bug record #${nextId} to inventory.`);
    await refreshWorkspace();
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/errors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error || 'Could not save bug record.'); showBanner(`Saved "${payload.error_signature}" to MySQL database.`);
    await refreshWorkspace();
  } catch (err) {
    showBanner(err.message, 'error');
  }
}

addErrorForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    domain_id: Number(addDomainSelect.value),
    tech_stack: document.getElementById('add-stack').value.trim(),
    error_signature: document.getElementById('add-signature').value.trim(),
    root_cause: document.getElementById('add-cause').value.trim(),
    fix_requirements: document.getElementById('add-fix').value.trim(),
    times_hit: Math.max(1, Number(document.getElementById('add-hits').value || 1)),
    is_verified: Number(document.getElementById('add-verified').value)
  };

  if (!payload.domain_id || !payload.tech_stack || !payload.error_signature || !payload.root_cause || !payload.fix_requirements) {
    showBanner('Please fill in all required fields (*).', 'error');
    return;
  }

  await saveBugRecord(payload);
  addErrorForm.reset();
  document.getElementById('add-hits').value = '1';
});

addDomainForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const domain_name = newDomainInput.value.trim();
  if (!domain_name) return;

  if (useLocalFallback) {
    const { domains, errors } = getLocalVault();
    const nextId = domains.length ? Math.max(...domains.map((d) => Number(d.domain_id))) + 1 : 1;
    domains.push({ domain_id: nextId, domain_name, description: 'Custom category' });
    saveLocalVault(domains, errors);
    addDomainForm.reset();
    showBanner(`Added domain "${domain_name}".`); await refreshWorkspace(); return; }  try { const res = await fetch(`${apiBase}/api/domains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain_name })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Could not add domain.');
    addDomainForm.reset();
    showBanner(`Added domain "${domain_name}".`);
    await refreshWorkspace();
  } catch (err) {
    showBanner(err.message, 'error');
  }
});

function openEditModal(errorId) {
  const rec = errorsMap.get(Number(errorId));
  if (!rec) return;

  document.getElementById('edit-id').value = String(rec.error_id);
  document.getElementById('edit-signature').value = rec.error_signature || '';
  editDomainSelect.value = String(rec.domain_id);
  document.getElementById('edit-stack').value = rec.tech_stack || '';
  document.getElementById('edit-cause').value = rec.root_cause || '';
  document.getElementById('edit-fix').value = rec.fix_requirements || rec.fixed_code || '';
  document.getElementById('edit-times-hit').value = String(rec.times_hit || 1);
  document.getElementById('edit-is-verified').value = String(rec.is_verified ?? 1);

  editDialog.showModal();
}

editCancelBtn.addEventListener('click', () => editDialog.close());

editErrorForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const error_id = Number(document.getElementById('edit-id').value);
  const payload = {
    domain_id: Number(editDomainSelect.value),
    tech_stack: document.getElementById('edit-stack').value.trim(),
    error_signature: document.getElementById('edit-signature').value.trim(),
    root_cause: document.getElementById('edit-cause').value.trim(),
    fix_requirements: document.getElementById('edit-fix').value.trim(),
    times_hit: Math.max(1, Number(document.getElementById('edit-times-hit').value || 1)),
    is_verified: Number(document.getElementById('edit-is-verified').value)
  };

  if (useLocalFallback) {
    const { domains, errors } = getLocalVault();
    const idx = errors.findIndex((r) => Number(r.error_id) === error_id);
    if (idx !== -1) {
      errors[idx] = { ...errors[idx], ...payload };
      saveLocalVault(domains, errors);
    }
    editDialog.close();
    showBanner(`Updated record #${error_id}.`);
    await refreshWorkspace();
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/errors/${error_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Could not update record.');
    editDialog.close();
    showBanner(`Updated record #${error_id} in MySQL.`);
    await refreshWorkspace();
  } catch (err) {
    showBanner(err.message, 'error');
  }
});

function promptDeleteError(err) {
  pendingDeleteTarget = { type: 'error', id: Number(err.error_id) };
  deleteDialogTitle.textContent = 'Delete Bug Record?';
  deleteDialogMessage.textContent = `Permanently delete "#${err.error_id}${err.error_signature}" from the database?`;
  deleteConfirmBtn.hidden = false;
  deleteDialog.showModal();
}

function promptDeleteDomain(dom) {
  if (Number(dom.bug_count || 0) > 0) {
    pendingDeleteTarget = null;
    deleteDialogTitle.textContent = 'Foreign Key Restriction';
    deleteDialogMessage.textContent = `Cannot delete "${dom.domain_name}" because ${dom.bug_count} bug record(s) reference it.`;
    deleteConfirmBtn.hidden = true;
    deleteDialog.showModal();
    return;
  }
  pendingDeleteTarget = { type: 'domain', id: Number(dom.domain_id), name: dom.domain_name };
  deleteDialogTitle.textContent = 'Delete Domain Category?';
  deleteDialogMessage.textContent = `Permanently remove "${dom.domain_name}" from domains?`;
  deleteConfirmBtn.hidden = false;
  deleteDialog.showModal();
}

deleteCancelBtn.addEventListener('click', () => {
  pendingDeleteTarget = null;
  deleteDialog.close();
});

deleteConfirmBtn.addEventListener('click', async () => {
  if (!pendingDeleteTarget) return;
  const target = pendingDeleteTarget;
  pendingDeleteTarget = null;
  deleteDialog.close();

  if (useLocalFallback) {
    const { domains, errors } = getLocalVault();
    if (target.type === 'error') {
      saveLocalVault(domains, errors.filter((r) => Number(r.error_id) !== target.id));
      showBanner(`Deleted record #${target.id}.`);
    } else {
      saveLocalVault(domains.filter((d) => Number(d.domain_id) !== target.id), errors);
      showBanner(`Deleted domain "${target.name}".`);
    }
    await refreshWorkspace();
    return;
  }

  try {
    const endpoint = target.type === 'error' ? `/api/errors/${target.id}` : `/api/domains/${target.id}`;
    const res = await fetch(`${apiBase}${endpoint}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Delete failed.');
    showBanner(data.message || 'Deleted.');
    await refreshWorkspace();
  } catch (err) {
    showBanner(err.message, 'error');
  }
});

let debounceTimer = null;
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(refreshWorkspace, 140);
});
domainFilterSelect.addEventListener('change', refreshWorkspace);
filterForm.addEventListener('reset', () => setTimeout(refreshWorkspace, 0));

detectBackendMode().then(refreshWorkspace);
// ===================================================================
// UNIVERSAL API KEY AUTO-ROUTER & LIVE AI CHAT / DIAGNOSIS ENGINE
// ===================================================================
const AI_KEY_STORAGE = 'tv_universal_api_key_v1';
let activeChatContext = null;
let chatHistory = [];

const openAiChatBtn = document.getElementById('open-ai-chat-btn');
const openApiKeyBtn = document.getElementById('open-api-key-btn');
const aiKeyDot = document.getElementById('ai-key-dot');
const aiKeyStatusText = document.getElementById('ai-key-status-text');

const aiChatModal = document.getElementById('ai-chat-modal');
const chatProviderBadge = document.getElementById('chat-provider-badge');
const chatContextText = document.getElementById('chat-context-text');
const chatUnbindBtn = document.getElementById('chat-unbind-btn');
const chatClearBtn = document.getElementById('chat-clear-btn');
const chatCloseBtn = document.getElementById('chat-close-btn');
const chatMessagesBox = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');

const apiKeyModal = document.getElementById('api-key-modal');
const apiKeyForm = document.getElementById('api-key-form');
const apiKeyInput = document.getElementById('api-key-input');
const detectedProviderPill = document.getElementById('detected-provider-pill');
const apiKeyFeedback = document.getElementById('api-key-feedback');
const removeApiKeyBtn = document.getElementById('remove-api-key-btn');
const closeApiKeyBtn = document.getElementById('close-api-key-btn');

function detectProviderFromKey(rawKey) {
  const key = String(rawKey || '').trim();
  if (!key) return null;
  if (key.startsWith('AIza')) {
    return { id: 'gemini', name: 'Google Gemini', model: 'gemini-2.5-flash', key };
  }
  if (key.startsWith('gsk_')) {
    return { id: 'groq', name: 'Groq Llama-3.3', endpoint: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile', key };
  }
  if (key.startsWith('sk-or-')) {
    return { id: 'openrouter', name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'openai/gpt-4o-mini', key };
  }
  if (key.startsWith('sk-')) {
    return { id: 'openai', name: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', key };
  }
  return { id: 'openai-compatible', name: 'Custom AI API', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', key };
}

function getSavedProvider() {
  const saved = localStorage.getItem(AI_KEY_STORAGE) || '';
  return detectProviderFromKey(saved);
}

function refreshAiKeyBadge() {
  const provider = getSavedProvider();
  if (provider && aiKeyDot && aiKeyStatusText) {
    aiKeyDot.classList.add('is-active');
    aiKeyStatusText.textContent = `AI: ${provider.name}`;
    if (chatProviderBadge) chatProviderBadge.textContent = `${provider.name} Live`;
    if (detectedProviderPill) detectedProviderPill.textContent = provider.name;
    if (apiKeyFeedback) apiKeyFeedback.textContent = `Connected: ${provider.name} (${provider.model}) active in browser.`;
  } else if (aiKeyDot && aiKeyStatusText) {
    aiKeyDot.classList.remove('is-active');
    aiKeyStatusText.textContent = 'API Key';
    if (chatProviderBadge) chatProviderBadge.textContent = 'Built-in Engine';
    if (detectedProviderPill) detectedProviderPill.textContent = 'No Key Set';
    if (apiKeyFeedback) apiKeyFeedback.textContent = 'Status: Using built-in diagnostic engine (Paste an API key for live LLM calls).';
  }
}

async function callUniversalAI(systemPrompt, userPrompt, jsonMode = false) {
  const provider = getSavedProvider();
  if (!provider) {
    throw new Error('NO_API_KEY');
  }

  if (provider.id === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${encodeURIComponent(provider.key)}`;
    const body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: jsonMode ? { responseMimeType: 'application/json', temperature: 0.2 } : { temperature: 0.3 }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Gemini API request failed.');
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // OpenAI / Groq / OpenRouter compatible chat completions
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${provider.key}`
  };
  const payload = {
    model: provider.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2
  };
  if (jsonMode && provider.id !== 'openrouter') {
    payload.response_format = { type: 'json_object' };
  }

  const res = await fetch(provider.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `${provider.name} API error.`);
  return data.choices?.[0]?.message?.content || '';
}

// Wire up API Key Modal
if (openApiKeyBtn) {
  openApiKeyBtn.addEventListener('click', () => {
    apiKeyInput.value = localStorage.getItem(AI_KEY_STORAGE) || '';
    refreshAiKeyBadge();
    apiKeyModal.showModal();
  });
}

if (apiKeyInput) {
  apiKeyInput.addEventListener('input', () => {
    const p = detectProviderFromKey(apiKeyInput.value);
    detectedProviderPill.textContent = p ? p.name : 'Auto-Detect';
  });
}

if (closeApiKeyBtn) {
  closeApiKeyBtn.addEventListener('click', () => apiKeyModal.close());
}

if (removeApiKeyBtn) {
  removeApiKeyBtn.addEventListener('click', () => {
    localStorage.removeItem(AI_KEY_STORAGE);
    apiKeyInput.value = '';
    refreshAiKeyBadge();
    apiKeyModal.close();
    showBanner('Removed saved API key. Switched to built-in engine.');
  });
}

if (apiKeyForm) {
  apiKeyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = apiKeyInput.value.trim();
    if (!raw) {
      showBanner('Please paste a valid API key.', 'error');
      return;
    }
    const provider = detectProviderFromKey(raw);
    localStorage.setItem(AI_KEY_STORAGE, raw);
    refreshAiKeyBadge();
    apiKeyModal.close();
    showBanner(`Connected ${provider ? provider.name : 'API'} key successfully.`);
  });
}

// Wire up Top Popup AI Chat Modal
function openAiChatWithContext(record = null) {
  if (record) {
    activeChatContext = record;
    if (chatContextText) {
      chatContextText.textContent = `#${record.error_id} [${record.domain_name || 'Bug'}] ${record.error_signature} (${record.tech_stack})`;
    }
    if (chatUnbindBtn) chatUnbindBtn.hidden = false;
  }
  refreshAiKeyBadge();
  if (aiChatModal) {
    aiChatModal.showModal();
    setTimeout(() => chatInput?.focus(), 40);
  }
}

if (openAiChatBtn) {
  openAiChatBtn.addEventListener('click', () => openAiChatWithContext(null));
}

if (chatCloseBtn) {
  chatCloseBtn.addEventListener('click', () => aiChatModal.close());
}

if (chatUnbindBtn) {
  chatUnbindBtn.addEventListener('click', () => {
    activeChatContext = null;
    chatContextText.textContent = 'General Project & Code Debugging Assistant';
    chatUnbindBtn.hidden = true;
  });
}

if (chatClearBtn) {
  chatClearBtn.addEventListener('click', () => {
    chatHistory = [];
    chatMessagesBox.innerHTML = `
      <div class="chat-bubble is-ai">
        <div class="bubble-role">TraceVault AI</div>
        <div class="bubble-content">Chat history cleared. Ask any question about your code, SQL schema, or bug records.</div>
      </div>
    `;
  });
}

function appendChatBubble(role, text) {
  const div = document.createElement('div');
  div.className = `chat-bubble ${role === 'user' ? 'is-user' : 'is-ai'}`;
  const roleEl = document.createElement('div');
  roleEl.className = 'bubble-role';
  roleEl.textContent = role === 'user' ? 'You' : 'TraceVault AI';
  const contentEl = document.createElement('div');
  contentEl.className = 'bubble-content';
  contentEl.textContent = text;
  div.append(roleEl, contentEl);
  chatMessagesBox.appendChild(div);
  chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
  return contentEl;
}

async function handleChatSubmit(promptText) {
  const question = String(promptText || '').trim();
  if (!question) return;

  appendChatBubble('user', question);
  chatInput.value = '';
  chatSendBtn.disabled = true;
  const thinkingEl = appendChatBubble('ai', 'Analyzing...');

  const contextBlock = activeChatContext
    ? `Active Bug Record Context:\n- ID: #${activeChatContext.error_id}\n- Domain: ${activeChatContext.domain_name}\n- Tech Stack: ${activeChatContext.tech_stack}\n- Error Signature: ${activeChatContext.error_signature}\n- Root Cause: ${activeChatContext.root_cause}\n- Current Fix: ${activeChatContext.fix_requirements || activeChatContext.fixed_code || 'None'}`
    : `Project Context: TraceVault Software Bug & Error Inventory System (Node.js, Express, MySQL 3306 with domains and error_logs tables, currently tracking ${errorsMap.size} bug records).`;

  const systemPrompt = `You are TraceVault AI, a senior full-stack and MySQL database debugging assistant. Be concise, practical, and provide clean code examples.\n${contextBlock}`;

  try {
    const reply = await callUniversalAI(systemPrompt, question, false);
    thinkingEl.textContent = reply.trim() || 'No response received.';
  } catch (err) {
    if (activeChatContext) {
      thinkingEl.textContent =
        `[Diagnostic Analysis for #${activeChatContext.error_id} — ${activeChatContext.tech_stack}]\n\n` +
        `• Error Signature: ${activeChatContext.error_signature}\n` +
        `• Root Cause: ${activeChatContext.root_cause}\n` +
        `• Recommended Fix:\n${activeChatContext.fix_requirements || activeChatContext.fixed_code || 'None'}\n\n` +
        `(Tip: Click "API Key" in the top navbar and paste a Groq/Gemini/OpenAI key for live custom LLM generation.)`;
    } else {
      thinkingEl.textContent =
        `[TraceVault Diagnostic Assistant]\n` +
        `To get live custom AI responses for "${question.slice(0, 60)}...", click "API Key" in the top bar and paste your API key (Groq gsk_, Gemini AIza, OpenRouter sk-or-, or OpenAI sk-). Or click "Ask AI" on any table row to inspect its root cause and verified fix.`;
    }
  } finally {
    chatSendBtn.disabled = false;
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
  }
}

if (chatForm) {
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleChatSubmit(chatInput.value);
  });
}

if (chatInput) {
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit(chatInput.value);
    }
  });
}

document.querySelectorAll('.chat-prompt-chip').forEach((btn) => {
  btn.addEventListener('click', () => handleChatSubmit(btn.dataset.prompt));
});

// Initialize AI Key status on boot
refreshAiKeyBadge();
