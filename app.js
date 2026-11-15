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
  }, 4200);
}

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
      dbStatusText.textContent = 'MySQL 3306 Connected';
      return;
    }
  } catch (_e) {}

  try {
    const resLocal = await fetch('http://localhost:3000/api/health', { cache: 'no-store' });
    if (resLocal.ok) {
      apiBase = 'http://localhost:3000';
      useLocalFallback = false;
      dbStatusText.textContent = 'MySQL 3306 Connected';
      return;
    }
  } catch (_e) {}

  useLocalFallback = true;
  dbStatusText.textContent = 'Cloud Vault Active';
}

function populateDomainDropdowns(domains) {
  const prevAdd = addDomainSelect.value;
  const prevFilter = domainFilterSelect.value;
  const prevEdit = editDomainSelect.value;

  addDomainSelect.innerHTML = '';
  editDomainSelect.innerHTML = '';
  domainFilterSelect.innerHTML = '<option value="all">All Domains</option>';

  domains.forEach((d) => {
    const optAdd = new Option(d.domain_name, String(d.domain_id));
    const optEdit = new Option(d.domain_name, String(d.domain_id));
    const optFilter = new Option(d.domain_name, String(d.domain_id));
    addDomainSelect.add(optAdd);
    editDomainSelect.add(optEdit);
    domainFilterSelect.add(optFilter);
  });

  if (prevAdd) addDomainSelect.value = prevAdd;
  if (prevEdit) editDomainSelect.value = prevEdit;
  if (prevFilter) domainFilterSelect.value = prevFilter;
}

function renderDomainSidebar(domains) {
  domainCountPill.textContent = `${domains.length} total`;
  domainListEl.innerHTML = '';

  domains.forEach((d) => {
    const li = document.createElement('li');
    li.className = 'domain-item';

    const left = document.createElement('div');
    left.className = 'domain-item-left';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = d.domain_name;

    const countSpan = document.createElement('span');
    countSpan.className = 'domain-count-badge';
    countSpan.textContent = `${d.bug_count || 0} bugs`;

    left.append(nameSpan, countSpan);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-secondary btn-sm';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => promptDeleteDomain(d));

    li.append(left, delBtn);
    domainListEl.appendChild(li);
  });
}

function renderErrorsTable(errors) {
  errorsMap.clear();
  errorsTbody.innerHTML = '';
  recordsCaption.textContent = `Saved Error Records (${errors.length} ${errors.length === 1 ? 'item' : 'items'})`;

  if (errors.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 8;
    td.className = 'empty-cell';
    td.textContent = 'No matching bug records found.';
    tr.appendChild(td);
    errorsTbody.appendChild(tr);
    return;
  }

  errors.forEach((err) => {
    errorsMap.set(Number(err.error_id), err);
    const tr = document.createElement('tr');

    // ID
    const tdId = document.createElement('td');
    tdId.className = 'col-id';
    const idPill = document.createElement('span');
    idPill.className = 'id-pill';
    idPill.textContent = `#${err.error_id}`;
    tdId.appendChild(idPill);

    // Signature + Root Cause
    const tdSig = document.createElement('td');
    const sigTitle = document.createElement('div');
    sigTitle.className = 'sig-title';
    sigTitle.textContent = err.error_signature;
    const causeSub = document.createElement('div');
    causeSub.className = 'cause-sub';
    causeSub.textContent = `Cause: ${err.root_cause}`;
    tdSig.append(sigTitle, causeSub);

    // Domain
    const tdDom = document.createElement('td');
    const domBadge = document.createElement('span');
    domBadge.className = 'domain-badge';
    domBadge.textContent = err.domain_name || 'General';
    tdDom.appendChild(domBadge);

    // Tech Stack
    const tdStack = document.createElement('td');
    tdStack.textContent = err.tech_stack;

    // Fix Requirements
    const tdFix = document.createElement('td');
    tdFix.textContent = err.fix_requirements || err.fixed_code || '';

    // Hits
    const tdHits = document.createElement('td');
    tdHits.className = 'col-center';
    const hitsSpan = document.createElement('span');
    hitsSpan.className = 'hits-pill';
    hitsSpan.textContent = String(err.times_hit || 1);
    tdHits.appendChild(hitsSpan);

    // Verified Status
    const tdStatus = document.createElement('td');
    tdStatus.className = 'col-center';
    const statusPill = document.createElement('span');
    const verified = Number(err.is_verified ?? 1) === 1;
    statusPill.className = verified ? 'verified-pill' : 'pending-pill';
    statusPill.textContent = verified ? 'Verified' : 'Pending';
    tdStatus.appendChild(statusPill);

    // Actions
    const tdActions = document.createElement('td');
    tdActions.className = 'col-center';
    const actionWrap = document.createElement('div');
    actionWrap.className = 'action-group';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-secondary btn-sm';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openEditModal(err.error_id));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-danger btn-sm';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => promptDeleteError(err));

    actionWrap.append(editBtn, delBtn);
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

// Add New Bug Record
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

  if (useLocalFallback) {
    const { domains, errors } = getLocalVault();
    const nextId = errors.length ? Math.max(...errors.map((r) => Number(r.error_id))) + 1 : 1;
    errors.push({ error_id: nextId, ...payload });
    saveLocalVault(domains, errors);
    addErrorForm.reset();
    document.getElementById('add-hits').value = '1';
    showBanner(`Saved bug record #${nextId} to vault.`);
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
    addErrorForm.reset();
    document.getElementById('add-hits').value = '1';
    showBanner(`Saved bug record "${payload.error_signature}" to MySQL.`);
    await refreshWorkspace();
  } catch (err) {
    showBanner(err.message, 'error');
  }
});

// Add New Domain Category
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

// Open Edit Modal (Including times_hit and is_verified)
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
    showBanner(`Updated record #${error_id} successfully.`);
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

// Delete Confirmation Prompts
function promptDeleteError(err) {
  pendingDeleteTarget = { type: 'error', id: Number(err.error_id) };
  deleteDialogTitle.textContent = 'Delete Bug Record?';
  deleteDialogMessage.textContent = `Permanently delete "#${err.error_id} ${err.error_signature}" from the database? This action cannot be undone.`;
  deleteConfirmBtn.hidden = false;
  deleteDialog.showModal();
}

function promptDeleteDomain(dom) {
  if (Number(dom.bug_count || 0) > 0) {
    pendingDeleteTarget = null;
    deleteDialogTitle.textContent = 'Domain In Use (Foreign Key Protected)';
    deleteDialogMessage.textContent = `Cannot delete "${dom.domain_name}" because ${dom.bug_count} bug record(s) reference it. Reassign or delete those records first.`;
    deleteConfirmBtn.hidden = true;
    deleteDialog.showModal();
    return;
  }
  pendingDeleteTarget = { type: 'domain', id: Number(dom.domain_id), name: dom.domain_name };
  deleteDialogTitle.textContent = 'Delete Domain Category?';
  deleteDialogMessage.textContent = `Permanently remove "${dom.domain_name}" from the domains table?`;
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
      const nextErrors = errors.filter((r) => Number(r.error_id) !== target.id);
      saveLocalVault(domains, nextErrors);
      showBanner(`Deleted record #${target.id}.`);
    } else {
      const nextDomains = domains.filter((d) => Number(d.domain_id) !== target.id);
      saveLocalVault(nextDomains, errors);
      showBanner(`Deleted domain "${target.name}".`);
    }
    await refreshWorkspace();
    return;
  }

  try {
    const endpoint = target.type === 'error' ? `/api/errors/${target.id}` : `/api/domains/${target.id}`;
    const res = await fetch(`${apiBase}${endpoint}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Delete operation failed.');
    showBanner(data.message || 'Deleted successfully.');
    await refreshWorkspace();
  } catch (err) {
    showBanner(err.message, 'error');
  }
});

// Search & Filter Listeners
let debounceTimer = null;
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(refreshWorkspace, 150);
});
domainFilterSelect.addEventListener('change', refreshWorkspace);
filterForm.addEventListener('reset', () => {
  setTimeout(refreshWorkspace, 0);
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    searchInput.focus();
  }
});

// Initialize Application
detectBackendMode().then(refreshWorkspace);