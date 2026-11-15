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

const CODE_PRESETS = {
  cors: {
    domain_id: 1,
    tech_stack: 'Express / Fetch CORS',
    code: `fetch('http://localhost:4000/api/orders', {\n  method: 'POST',\n  credentials: 'include'\n});\n// Error: Access to fetch at 'http://localhost:4000/api/orders' from origin 'http://localhost:3000' has been blocked by CORS policy`,
    signature: 'Access to fetch at origin blocked by CORS policy (credentials mode)',
    cause: 'Backend server does not include Access-Control-Allow-Origin and Access-Control-Allow-Credentials headers.',
    fix: `const cors = require('cors');\napp.use(cors({ origin: 'http://localhost:3000', credentials: true }));`
  },
  react: {
    domain_id: 1,
    tech_stack: 'React 18 / Hooks',
    code: `function CounterView({ items }) {\n  const [total, setTotal] = useState(0);\n  setTotal(items.length);\n  return <div>{total}</div>;\n}`,
    signature: 'Too many re-renders. React limits the number of renders to prevent an infinite loop',
    cause: 'setTotal(items.length) is called unconditionally inside the component render body.',
    fix: `useEffect(() => {\n  setTotal(items.length);\n}, [items.length]);`
  },
  mysql: {
    domain_id: 3,
    tech_stack: 'MySQL 8.0 / Foreign Key',
    code: `INSERT INTO error_logs (domain_id, tech_stack, error_signature)\nVALUES (99, 'MySQL 8.0', 'Foreign Key Test');\n-- Error 1452: Cannot add or update a child row: a foreign key constraint fails`,
    signature: 'ER_NO_REFERENCED_ROW_2: Foreign key constraint fails on domain_id',
    cause: 'Attempted to insert child record with domain_id = 99 which does not exist in parent table domains.',
    fix: `INSERT IGNORE INTO domains (domain_id, domain_name, description) VALUES (1, 'Frontend', 'UI layer');\nINSERT INTO error_logs (domain_id, ...) VALUES (1, ...);`
  },
  async: {
    domain_id: 2,
    tech_stack: 'Node.js / Express',
    code: `app.post('/api/login', async (req, res) => {\n  if (!req.body.email) {\n    res.status(400).json({ error: 'Email required' });\n  }\n  res.json({ status: 'ok' });\n});`,
    signature: 'Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client',
    cause: 'Missing return keyword before res.status(400).json(), causing execution to continue to res.json().',
    fix: `if (!req.body.email) {\n  return res.status(400).json({ error: 'Email required' });\n}\nreturn res.json({ status: 'ok' });`
  }
};

const AI_KEY_STORAGE = 'tv_universal_api_key_v1';
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
const fixerWorkspace = document.getElementById('live-fixer-workspace');
const closeFixerModalBtn = document.getElementById('close-fixer-modal-btn');

const fixerDomainSelect = document.getElementById('fixer-domain');
const fixerLangSelect = document.getElementById('fixer-lang-select');
const fixerStackInput = document.getElementById('fixer-stack');
const fixerCodeInput = document.getElementById('fixer-code-input');
const fixerOutSig = document.getElementById('fixer-out-sig');
const fixerOutCause = document.getElementById('fixer-out-cause');
const fixerOutFix = document.getElementById('fixer-out-fix');
const clearFixerBtn = document.getElementById('clear-fixer-btn');
const runDiagnosisBtn = document.getElementById('run-diagnosis-btn');
const commitDiagnosisBtn = document.getElementById('commit-diagnosis-btn');

const chatMessagesBox = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatProviderPill = document.getElementById('chat-provider-pill');

const openApiKeyBtn = document.getElementById('open-api-key-btn');
const modalApiKeyBtn = document.getElementById('modal-api-key-btn');
const navKeyDot = document.getElementById('nav-key-dot');
const navKeyLabel = document.getElementById('nav-key-label');
const modalKeyDot = document.getElementById('modal-key-dot');
const modalKeyLabel = document.getElementById('modal-key-label');

const apiKeyModal = document.getElementById('api-key-modal');
const apiKeyForm = document.getElementById('api-key-form');
const apiKeyInput = document.getElementById('api-key-input');
const detectedProviderPill = document.getElementById('detected-provider-pill');
const apiKeyFeedback = document.getElementById('api-key-feedback');
const removeApiKeyBtn = document.getElementById('remove-api-key-btn');
const closeApiKeyBtn = document.getElementById('close-api-key-btn');

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

// ===================================================================
// UNIVERSAL API KEY AUTO-ROUTER
// ===================================================================
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
  return { id: 'custom', name: 'Custom AI API', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', key };
}

function getSavedProvider() {
  return detectProviderFromKey(localStorage.getItem(AI_KEY_STORAGE) || '');
}

function refreshAiKeyUI() {
  const p = getSavedProvider();
  if (p) {
    navKeyDot.classList.add('is-active');
    modalKeyDot.classList.add('is-active');
    navKeyLabel.textContent = `🔑 AI: ${p.name}`;
    modalKeyLabel.textContent = `🔑 ${p.name} Active`;
    chatProviderPill.textContent = `${p.name} Connected`;
    detectedProviderPill.textContent = p.name;
    apiKeyFeedback.textContent = `Active: ${p.name} (${p.model}) connected and ready.`;
  } else {
    navKeyDot.classList.remove('is-active');
    modalKeyDot.classList.remove('is-active');
    navKeyLabel.textContent = '🔑 Connect API Key';
    modalKeyLabel.textContent = '🔑 Set API Key';
    chatProviderPill.textContent = 'Built-in AI Ready';
    detectedProviderPill.textContent = 'Auto-Detect';
    apiKeyFeedback.textContent = 'Current Mode: Built-in Diagnostic Engine (Paste an API key above for live LLM calls).';
  }
}

async function callUniversalAI(systemPrompt, userPrompt) {
  const p = getSavedProvider();
  if (!p) throw new Error('NO_API_KEY');

  if (p.id === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${p.model}:generateContent?key=${encodeURIComponent(p.key)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Gemini API request failed.');
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  const res = await fetch(p.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${p.key}`
    },
    body: JSON.stringify({
      model: p.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `${p.name} API error.`);
  return data.choices?.[0]?.message?.content || '';
}

function openKeyDialog() {
  apiKeyInput.value = localStorage.getItem(AI_KEY_STORAGE) || '';
  refreshAiKeyUI();
  apiKeyModal.showModal();
}

openApiKeyBtn.addEventListener('click', openKeyDialog);
modalApiKeyBtn.addEventListener('click', openKeyDialog);
closeApiKeyBtn.addEventListener('click', () => apiKeyModal.close());

apiKeyInput.addEventListener('input', () => {
  const p = detectProviderFromKey(apiKeyInput.value);
  detectedProviderPill.textContent = p ? p.name : 'Auto-Detect';
});

removeApiKeyBtn.addEventListener('click', () => {
  localStorage.removeItem(AI_KEY_STORAGE);
  apiKeyInput.value = '';
  refreshAiKeyUI();
  apiKeyModal.close();
  appendChat('ai', 'API key removed. Switched to built-in diagnostic engine.');
});

apiKeyForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const raw = apiKeyInput.value.trim();
  if (!raw) return;
  const p = detectProviderFromKey(raw);
  localStorage.setItem(AI_KEY_STORAGE, raw);
  refreshAiKeyUI();
  apiKeyModal.close();
  appendChat('ai', `Connected ${p.name} (${p.model})! You can now analyze code or chat with me live.`);
  showBanner(`Connected ${p.name} API key.`);
});

// ===================================================================
// WORKSPACE MODE SWITCHING (DEFAULT LAB VIEW vs Alt+L POPUP)
// ===================================================================
function setWorkspaceMode(mode) {
  const isFixer = mode === 'fixer';
  fixerWorkspace.hidden = !isFixer;
  tabLiveFixer.classList.toggle('is-active', isFixer);
  tabLabView.classList.toggle('is-active', !isFixer);
  if (isFixer) {
    setTimeout(() => fixerCodeInput.focus(), 40);
  }
}

tabLabView.addEventListener('click', () => setWorkspaceMode('lab'));
tabLiveFixer.addEventListener('click', () => setWorkspaceMode('fixer'));
closeFixerModalBtn.addEventListener('click', () => setWorkspaceMode('lab'));

fixerWorkspace.addEventListener('click', (e) => {
  if (e.target === fixerWorkspace) setWorkspaceMode('lab');
});

document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    setWorkspaceMode(fixerWorkspace.hidden ? 'fixer' : 'lab');
  } else if (e.key === 'Escape' && !fixerWorkspace.hidden && !apiKeyModal.open) {
    e.preventDefault();
    setWorkspaceMode('lab');
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    setWorkspaceMode('lab');
    searchInput.focus();
  }
});

// ===================================================================
// LIVE CODE BUG FIXER + LANGUAGE AUTO-DETECT + AI CHAT
// ===================================================================
function appendChat(role, text) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role === 'user' ? 'is-user' : 'is-ai'}`;
  div.textContent = role === 'user' ? `You: ${text}` : `AI: ${text}`;
  chatMessagesBox.appendChild(div);
  chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
  return div;
}

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
    appendChat('ai', `Loaded sample "${p.signature}". Root cause and fixed code are ready above—click "💾 Save Fix to Database Table" or ask me a follow-up question!`);
  });
});

clearFixerBtn.addEventListener('click', () => {
  fixerCodeInput.value = '';
  fixerOutSig.value = '';
  fixerOutCause.value = '';
  fixerOutFix.value = '';
  fixerStackInput.value = '';
});

function runLocalHeuristicDiagnosis(raw) {
  const lines = raw.split('\n');
  const errorLine = lines.find((l) => /error[:\s]|exception|er_[a-z0-9_]+|lock wait timeout|foreign key|headers_sent|cors|re-renders|hydration|eaddrinuse|econnrefused/i.test(l));
  const codeLines = lines.filter((l) => {
    const t = l.trim();
    return t !== '' && !t.startsWith('//') && !t.startsWith('--');
  });

  let sig = errorLine
    ? errorLine.replace(/^\s*(\/\/|--|\/\*+|\*+)\s*/, '').replace(/\*+\/\s*$/, '').trim()
    : (codeLines[0] || lines[0]).replace(/^\s*(\/\/|--)\s*/, '').trim();

  let domainId = Number(fixerDomainSelect.value || 1);
  let stack = fixerLangSelect.value !== 'auto' ? fixerLangSelect.value : '';
  let cause = '';
  let fix = '';

  if (/beginTransaction|getConnection|ER_LOCK_WAIT_TIMEOUT|lock wait timeout/i.test(raw)) {
    domainId = 3;
    stack = stack || 'Node.js / MySQL Transaction';
    cause = 'Database transaction lacks try/catch rollback handling and fails to release the pooled connection in a finally block.';
    fix = `app.post('/api/checkout', async (req, res) => {\n  const conn = await pool.getConnection();\n  try {\n    await conn.beginTransaction();\n    const [order] = await conn.execute('INSERT INTO orders (user_id) VALUES (?)', [req.body.userId]);\n    await conn.commit();\n    return res.json({ success: true, orderId: order.insertId });\n  } catch (err) {\n    await conn.rollback();\n    return res.status(500).json({ error: err.message });\n  } finally {\n    conn.release();\n  }\n});`;
  } else if (/cors|Access-Control-Allow-Origin/i.test(raw)) {
    domainId = 1;
    stack = stack || 'Express / Fetch CORS';
    cause = 'Cross-origin request blocked because backend omitted Access-Control-Allow-Origin headers.';
    fix = `const cors = require('cors');\napp.use(cors({ origin: 'http://localhost:3000', credentials: true }));`;
  } else if (/useState|re-renders|useEffect/i.test(raw)) {
    domainId = 1;
    stack = stack || 'React 18 / Hooks';
    cause = 'State setter invoked directly inside component render body, causing an infinite loop.';
    fix = `useEffect(() => {\n  ${codeLines.join('\n  ')}\n}, [dependencies]);`;
  } else if (/foreign key|ER_NO_REFERENCED_ROW|1452/i.test(raw)) {
    domainId = 3;
    stack = stack || 'MySQL 8.0 / InnoDB';
    cause = 'Child row references a domain_id that does not exist in parent table domains.';
    fix = `INSERT IGNORE INTO domains (domain_id, domain_name, description) VALUES (1, 'Frontend', 'UI layer');\n${codeLines.join('\n')}`;
  } else if (/HEADERS_SENT|headers after they are sent/i.test(raw)) {
    domainId = 2;
    stack = stack || 'Node.js / Express';
    cause = 'Multiple res.json() calls executed in one route handler due to missing return statement.';
    fix = codeLines.map((l) => (l.includes('res.status(') && !l.trim().startsWith('return ') ? l.replace('res.status(', 'return res.status(') : l)).join('\n');
  } else {
    if (!stack) {
      if (/SELECT|INSERT|UPDATE|DELETE|CREATE TABLE/i.test(raw)) { domainId = 3; stack = 'MySQL / SQL'; }
      else if (/def |import |print\(/i.test(raw)) { domainId = 2; stack = 'Python'; }
      else if (/#include|std::|printf\(/i.test(raw)) { domainId = 2; stack = 'C / C++'; }
      else if (/app\.(get|post|put|delete)|req,\s*res/i.test(raw)) { domainId = 2; stack = 'Node.js / Express'; }
      else { stack = 'JavaScript / Runtime'; }
    }
    cause = `Unhandled runtime exception in ${stack} block without defensive error boundary.`;
    const body = (codeLines.length ? codeLines : lines).map((l) => `  ${l}`).join('\n');
    fix = `try {\n${body}\n} catch (err) {\n  console.error('Handled error:', err.message);\n}`;
  }

  return { domainId, stack, sig: sig.slice(0, 240), cause, fix };
}

runDiagnosisBtn.addEventListener('click', async () => {
  const raw = fixerCodeInput.value.trim();
  if (!raw) {
    showBanner('Please paste broken code or click a sample button first.', 'error');
    return;
  }

  runDiagnosisBtn.disabled = true;
  runDiagnosisBtn.textContent = '⏳ Analyzing Code...';

  // First fill instant heuristic result so fields are never empty
  const heur = runLocalHeuristicDiagnosis(raw);
  fixerDomainSelect.value = String(heur.domainId);
  fixerStackInput.value = heur.stack;
  fixerOutSig.value = heur.sig;
  fixerOutCause.value = heur.cause;
  fixerOutFix.value = heur.fix;

  const provider = getSavedProvider();
  if (provider) {
    try {
      const sys = `You are TraceVault AI Bug Fixer. Analyze the user's broken code or stack trace and respond in valid JSON with exact keys: {"error_signature": "...", "tech_stack": "...", "domain_id": 1|2|3|4, "root_cause": "...", "fixed_code": "...", "chat_summary": "..."} where domain_id is 1 (Frontend), 2 (Backend), 3 (Database), or 4 (Fullstack).`;
      const reply = await callUniversalAI(sys, raw);
      const cleanJson = reply.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.error_signature) fixerOutSig.value = parsed.error_signature;
      if (parsed.tech_stack) fixerStackInput.value = parsed.tech_stack;
      if (parsed.domain_id) fixerDomainSelect.value = String(parsed.domain_id);
      if (parsed.root_cause) fixerOutCause.value = parsed.root_cause;
      if (parsed.fixed_code) fixerOutFix.value = parsed.fixed_code;
      appendChat('ai', parsed.chat_summary || `Analyzed with ${provider.name}! Root cause: ${fixerOutCause.value}`);
    } catch (_err) {
      appendChat('ai', `Diagnosed "${heur.sig}" (${heur.stack}). Root Cause: ${heur.cause}`);
    }
  } else {
    appendChat('ai', `Diagnosed "${heur.sig}" (${heur.stack}).\n• Root Cause: ${heur.cause}\n• Fixed code has been generated in the box above. Click "💾 Save Fix to Database Table" to store it!`);
  }

  runDiagnosisBtn.disabled = false;
  runDiagnosisBtn.textContent = '⚡ Analyze & Fix Bug with AI';
});

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = chatInput.value.trim();
  if (!q) return;
  appendChat('user', q);
  chatInput.value = '';
  chatSendBtn.disabled = true;

  const waitingMsg = appendChat('ai', 'Thinking...');
  const currentCode = fixerCodeInput.value.trim();
  const currentSig = fixerOutSig.value.trim();
  const sys = `You are TraceVault AI Assistant. Answer concisely with clear code or SQL examples.\nCurrent Code Context: ${currentCode || 'None'}\nCurrent Error Signature: ${currentSig || 'General Project Question'}`;

  try {
    const ans = await callUniversalAI(sys, q);
    waitingMsg.textContent = `AI: ${ans.trim()}`;
  } catch (_err) {
    if (currentSig) {
      waitingMsg.textContent = `AI: For "${currentSig}", the root cause is: ${fixerOutCause.value}. Use the patched code shown above to resolve it. (Tip: Click "🔑 API Key" at the top right of this window and paste a Gemini/Groq/OpenAI key for live custom chat!)`;
    } else {
      waitingMsg.textContent = `AI: Please click "🔑 API Key" at the top right of this popup and paste a free Gemini (AIza...) or Groq (gsk_...) key to chat freely on any topic, or paste broken code on the left and click "⚡ Analyze & Fix Bug with AI"!`;
    }
  } finally {
    chatSendBtn.disabled = false;
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
  }
});

commitDiagnosisBtn.addEventListener('click', async () => {
  const payload = {
    domain_id: Number(fixerDomainSelect.value || 1),
    tech_stack: fixerStackInput.value.trim() || 'JavaScript / Node.js',
    error_signature: fixerOutSig.value.trim(),
    root_cause: fixerOutCause.value.trim(),
    fix_requirements: fixerOutFix.value.trim(),
    times_hit: 1,
    is_verified: 1
  };
  if (!payload.error_signature || !payload.root_cause || !payload.fix_requirements) {
    showBanner('Click "⚡ Analyze & Fix Bug with AI" first so the solution fields are filled.', 'error');
    return;
  }
  await saveBugRecord(payload);
  setWorkspaceMode('lab');
});

// ===================================================================
// DATABASE INVENTORY & CRUD OPERATIONS
// ===================================================================
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
  domainCountPill.textContent = `${domains.length} rows`;
  domainListEl.innerHTML = '';

  domains.forEach((d) => {
    const li = document.createElement('li');
    li.className = 'domain-row-item';

    const left = document.createElement('div');
    left.className = 'domain-row-meta';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = d.domain_name;

    const countSpan = document.createElement('span');
    countSpan.className = 'domain-row-count';
    countSpan.textContent = `(${d.bug_count || 0})`;

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

function openRecordInAiFixer(err) {
  setWorkspaceMode('fixer');
  fixerDomainSelect.value = String(err.domain_id);
  fixerStackInput.value = err.tech_stack || '';
  fixerCodeInput.value = `// Bug Record #${err.error_id}: ${err.error_signature}\n// Tech Stack: ${err.tech_stack}\n\n${err.fix_requirements || ''}`;
  fixerOutSig.value = err.error_signature || '';
  fixerOutCause.value = err.root_cause || '';
  fixerOutFix.value = err.fix_requirements || '';
  appendChat('ai', `Bound to Record #${err.error_id} ("${err.error_signature}"). Ask me anything about this bug below!`);
}

function renderErrorsTable(errors) {
  errorsMap.clear();
  errorsTbody.innerHTML = '';
  recordsCaption.textContent = `Saved Error Records (${errors.length} ${errors.length === 1 ? 'item' : 'items'})`;

  if (errors.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 8;
    td.className = 'empty-row';
    td.textContent = 'No matching bug records found.';
    tr.appendChild(td);
    errorsTbody.appendChild(tr);
    return;
  }

  errors.forEach((err) => {
    errorsMap.set(Number(err.error_id), err);
    const tr = document.createElement('tr');

    const tdId = document.createElement('td');
    tdId.className = 'mono-id';
    tdId.textContent = `#${err.error_id}`;

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
    statusPill.className = `state-tag ${verified ? 'state-verified' : 'state-pending'}`;
    statusPill.textContent = verified ? 'Verified' : 'Pending';
    tdStatus.appendChild(statusPill);

    const tdActions = document.createElement('td');
    tdActions.className = 't-right';
    const actionWrap = document.createElement('div');
    actionWrap.className = 'row-actions';

    const askAiBtn = document.createElement('button');
    askAiBtn.type = 'button';
    askAiBtn.className = 'btn-secondary btn-xs';
    askAiBtn.textContent = '💬 Ask AI';
    askAiBtn.addEventListener('click', () => openRecordInAiFixer(err));

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-secondary btn-xs';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openEditModal(err.error_id));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-danger btn-xs';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => promptDeleteError(err));

    actionWrap.append(askAiBtn, editBtn, delBtn);
    tdActions.appendChild(actionWrap);

    tr.append(tdId, tdSig, tdDom, tdStack, tdFix, tdHits, tdStatus, tdActions);
    errorsTbody.appendChild(tr);
  });
}

function updateSummaryCards(stats) {
  statCountEl.textContent = String(stats.total_bugs ?? 0);
  statSumEl.textContent = String(stats.total_hits ?? 0);
  statAvgEl.textContent = Number(stats.avg_hits ?? 0).toFixed(1);
  statMaxEl.textContent = String(stats.max_hits ?? 0);
  statMinEl.textContent = String(stats.min_hits ?? 0);
}

async function refreshWorkspace() {
  const search = searchInput.value.trim();
  const domain_id = domainFilterSelect.value || 'all';

  if (useLocalFallback) {
    const { domains, errors } = getLocalVault();
    const enrichedDomains = domains.map((d) => ({
      ...d,
      bug_count: errors.filter((e) => Number(e.domain_id) === Number(d.domain_id)).length
    }));
    domainsState = enrichedDomains;
    populateDomainDropdowns(enrichedDomains);
    renderDomainSidebar(enrichedDomains);

    let filtered = errors.map((e) => {
      const dom = domains.find((d) => Number(d.domain_id) === Number(e.domain_id));
      return { ...e, domain_name: dom ? dom.domain_name : 'General' };
    });

    if (domain_id !== 'all') {
      filtered = filtered.filter((e) => Number(e.domain_id) === Number(domain_id));
    }
    if (search) {
      const q = search.toLowerCase();
      const numId = Number(q.replace(/^#/, ''));
      filtered = filtered.filter((e) =>
        (Number.isInteger(numId) && numId > 0 && Number(e.error_id) === numId) ||
        String(e.error_signature).toLowerCase().includes(q) ||
        String(e.tech_stack).toLowerCase().includes(q) ||
        String(e.root_cause).toLowerCase().includes(q) ||
        String(e.fix_requirements).toLowerCase().includes(q) ||
        String(e.domain_name).toLowerCase().includes(q)
      );
    }

    const total_bugs = filtered.length;
    const total_hits = filtered.reduce((acc, r) => acc + Number(r.times_hit || 1), 0);
    const avg_hits = total_bugs ? (total_hits / total_bugs).toFixed(1) : 0;
    const max_hits = total_bugs ? Math.max(...filtered.map((r) => Number(r.times_hit || 1))) : 0;
    const min_hits = total_bugs ? Math.min(...filtered.map((r) => Number(r.times_hit || 1))) : 0;

    updateSummaryCards({ total_bugs, total_hits, avg_hits, max_hits, min_hits });
    renderErrorsTable(filtered);
    return;
  }

  try {
    const qs = new URLSearchParams();
    if (domain_id && domain_id !== 'all') qs.set('domain_id', domain_id);
    if (search) qs.set('search', search);

    const [domRes, errRes, statRes] = await Promise.all([
      fetch(`${apiBase}/api/domains`),
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
    const res = await fetch(`${apiBase}/api/errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Could not save bug record.');
    showBanner(`Saved "${payload.error_signature}" to MySQL database.`);
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
    showBanner(`Added domain "${domain_name}".`);
    await refreshWorkspace();
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/domains`, {
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
  deleteDialogMessage.textContent = `Permanently delete "#${err.error_id} ${err.error_signature}" from the database?`;
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

refreshAiKeyUI();
detectBackendMode().then(refreshWorkspace);