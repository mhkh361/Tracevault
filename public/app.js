/**
 * TraceVault - Client-Side Single-Page Application (SPA) Controller
 * Option 1: Pure Obsidian Glass Edition (v4)
 * 
 * Features:
 * - Real Developer Workspace (starts 100% clean at 0 bugs & 0 hits)
 * - Isolated University DBMS Lab Evaluation Sandbox Modal (Alt + L)
 * - Dual-Storage Support: Live MySQL 8+ or Persistent Local Disk / Static Fallback
 * - Bulletproof BYOK AI Engine: Auto-detect key prefix, 16 free/paid models, retry chain
 * - Fault-tolerant JSON parser with <think>...</think> tag stripping
 * - Memory-First AI error scanning (checks vault memory before calling APIs)
 * - Context-aware interactive debug bot chat with quick action chips
 * - Full CRUD with custom Edit, Delete, Hit (+1 Stored Procedure), Verify toggles
 * - Instant filtering, debounced search, CSV/JSON vault exports
 * - Static GitHub Pages client-side fallback storage engine
 */

(function () {
  'use strict';

  // =====================================================================
  // STATE MANAGEMENT
  // =====================================================================
  const state = {
    real: {
      errors: [],
      stats: null,
      filters: {
        search: '',
        domain_id: 'all',
        tech_stack: '',
        verified: 'all',
        sort: 'hits'
      }
    },
    demo: {
      errors: [],
      stats: null,
      filters: {
        search: '',
        domain_id: 'all',
        sort: 'hits'
      }
    },
    domains: [
      { domain_id: 1, domain_name: 'Frontend' },
      { domain_id: 2, domain_name: 'Backend' },
      { domain_id: 3, domain_name: 'Database' },
      { domain_id: 4, domain_name: 'Fullstack' }
    ],
    activeError: null,
    activeEditMode: 'real',
    activeDeleteMode: 'real',
    editingRecordId: null,
    deletingRecordId: null,
    searchDebounceTimer: null,
    labSearchDebounceTimer: null,
    isStaticMode: false
  };

  // Provider Default Models
  const PROVIDER_DEFAULTS = {
    gemini: 'gemini-2.5-flash',
    groq: 'llama-3.3-70b-versatile',
    openai: 'gpt-4o-mini',
    openrouter: 'deepseek/deepseek-r1:free'
  };

  // Multi-Model Fallback Retry Chains
  const MODEL_FALLBACK_CHAINS = {
    gemini: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
    groq: ['llama-3.3-70b-versatile', 'qwen-2.5-coder-32b', 'llama-3.1-8b-instant'],
    openrouter: ['deepseek/deepseek-r1:free', 'deepseek/deepseek-chat:free', 'qwen/qwen-2.5-coder-32b-instruct:free', 'meta-llama/llama-3.3-70b-instruct:free'],
    openai: ['gpt-4o-mini', 'gpt-4o']
  };

  // 12 Realistic Seed Records for DBMS Lab Evaluation & Static Fallback
  const SEED_DEMO_RECORDS = [
    {
      error_id: 1,
      domain_id: 1,
      tech_stack: 'React',
      error_signature: "Cannot read properties of undefined (reading 'map')",
      signature_hash: '54bd8abe41415e13fb4a68ad28bc1345bec1e3ec62c00c7f27623df9b040b2cd',
      root_cause: 'State array initialized as undefined prior to async fetch completion.',
      fix_requirements: '1. Initialize state with empty array: const [items, setItems] = useState([]);\n2. Use optional chaining and fallback: (items || []).map(...)\n3. Add conditional loading spinner before rendering list.',
      source: 'ai',
      is_verified: 1,
      times_hit: 9,
      is_demo: 1,
      created_at: '2026-11-13T01:00:00.000Z',
      updated_at: '2026-11-13T01:00:00.000Z'
    },
    {
      error_id: 2,
      domain_id: 1,
      tech_stack: 'JavaScript',
      error_signature: 'Uncaught TypeError: Assignment to constant variable.',
      signature_hash: 'f12bd80a8b3ed1876012fe73b42438c17f9946f45ff31098db86fd71aa2a8cf8',
      root_cause: 'Attempting to reassign a variable declared with the const keyword.',
      fix_requirements: '1. Declare the identifier with let instead of const if value must change.\n2. If operating on an object/array, mutate properties rather than reassigning the identifier binding.',
      source: 'manual',
      is_verified: 1,
      times_hit: 4,
      is_demo: 1,
      created_at: '2026-11-13T01:00:00.000Z',
      updated_at: '2026-11-13T01:00:00.000Z'
    },
    {
      error_id: 3,
      domain_id: 1,
      tech_stack: 'CSS / Webpack',
      error_signature: 'ChunkLoadError: Loading chunk failed',
      signature_hash: '47382b5fb6c9d4aca7fdc0d4dc4cd55422cdaaac2f44036b4bc3c33fe2f019d0',
      root_cause: 'Dynamic bundle chunk missing or network cache mismatch following recent build deployment.',
      fix_requirements: '1. Catch dynamic import error and invoke window.location.reload(true) once.\n2. Configure output.publicPath and disable aggressive browser caching on index.html.',
      source: 'manual',
      is_verified: 0,
      times_hit: 3,
      is_demo: 1,
      created_at: '2026-11-13T01:00:00.000Z',
      updated_at: '2026-11-13T01:00:00.000Z'
    },
    {
      error_id: 4,
      domain_id: 2,
      tech_stack: 'Node.js',
      error_signature: 'Error: listen EADDRINUSE: address already in use :::3000',
      signature_hash: '866d0cb159d48348e57bea3402d4f1ccf8382242b55ffcc6a9684e96a0e9177e',
      root_cause: 'Another background instance or node process is actively bound to port 3000.',
      fix_requirements: '1. Identify and terminate the occupying PID: npx kill-port 3000\n2. Configure dynamic fallback: const PORT = process.env.PORT || 3001;\n3. Gracefully close server on SIGINT / SIGTERM signals.',
      source: 'manual',
      is_verified: 1,
      times_hit: 12,
      is_demo: 1,
      created_at: '2026-11-13T01:00:00.000Z',
      updated_at: '2026-11-13T01:00:00.000Z'
    },
    {
      error_id: 5,
      domain_id: 2,
      tech_stack: 'Express',
      error_signature: 'Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client',
      signature_hash: 'ea8f8511ed638ac5d9b727a6b5455a7116ae70f2c32e15bde8e69532ebcdc159',
      root_cause: 'Attempting multiple res.json() or res.send() calls in a single execution branch without returning.',
      fix_requirements: '1. Always return immediately on sending response: return res.status(400).json(...);\n2. Verify async middleware next() is not called after sending headers.',
      source: 'ai',
      is_verified: 1,
      times_hit: 7,
      is_demo: 1,
      created_at: '2026-11-13T01:00:00.000Z',
      updated_at: '2026-11-13T01:00:00.000Z'
    },
    {
      error_id: 6,
      domain_id: 2,
      tech_stack: 'Python / Flask',
      error_signature: "ModuleNotFoundError: No module named 'jwt'",
      signature_hash: 'd5a3f7aebe65bf884a0c8ec65e6b9fbd519bafe403308b0f9d9bc2caa642a1e1',
      root_cause: 'PyJWT or dependencies not installed in the currently active virtual environment.',
      fix_requirements: '1. Activate corresponding venv (.venv/Scripts/activate).\n2. Install required library: pip install PyJWT cryptography\n3. Freeze dependencies to requirements.txt.',
      source: 'manual',
      is_verified: 0,
      times_hit: 2,
      is_demo: 1,
      created_at: '2026-11-13T01:00:00.000Z',
      updated_at: '2026-11-13T01:00:00.000Z'
    },
    {
      error_id: 7,
      domain_id: 3,
      tech_stack: 'MySQL',
      error_signature: 'Error 1452: Cannot add or update a child row: a foreign key constraint fails',
      signature_hash: '22009c398b1e1a69918ffea4d521f507967ac86dbce287384b2b8fc869c4c13c',
      root_cause: 'Attempting to insert a foreign key reference that does not exist in the referenced parent table.',
      fix_requirements: '1. Ensure parent record exists in referenced table before inserting child row.\n2. Check datatype and sign consistency between FK and PK columns (e.g. INT vs INT UNSIGNED).',
      source: 'manual',
      is_verified: 1,
      times_hit: 8,
      is_demo: 1,
      created_at: '2026-11-13T01:00:00.000Z',
      updated_at: '2026-11-13T01:00:00.000Z'
    },
    {
      error_id: 8,
      domain_id: 3,
      tech_stack: 'MySQL Pool',
      error_signature: 'Error: Connection lost: The server closed the connection (PROTOCOL_CONNECTION_LOST)',
      signature_hash: '92e73db0db3b5a98a9a05578c438e47efe358e0780d46b79a5d9e25d537186bd',
      root_cause: 'Idle timeout exceeded on TCP socket or MySQL wait_timeout dropped connection.',
      fix_requirements: '1. Use mysql2 pool with enableKeepAlive: true and keepAliveInitialDelay: 10000.\n2. Handle connection error events and implement exponential backoff reconnection.',
      source: 'ai',
      is_verified: 1,
      times_hit: 5,
      is_demo: 1,
      created_at: '2026-11-13T01:00:00.000Z',
      updated_at: '2026-11-13T01:00:00.000Z'
    },
    {
      error_id: 9,
      domain_id: 3,
      tech_stack: 'MongoDB',
      error_signature: 'MongooseServerSelectionError: Server selection timed out after 30000 ms',
      signature_hash: '8b301c80854f6ee462c3a7398b93188e6aa44167cde17e079890495872c4b2f0',
      root_cause: 'Cluster IP access list blocks client IP, or cluster primary is unreachable.',
      fix_requirements: '1. Whitelist current public IP (or 0.0.0.0/0 for testing) in MongoDB Atlas Network Access.\n2. Verify cluster URI connection string and credentials in .env.',
      source: 'manual',
      is_verified: 0,
      times_hit: 3,
      is_demo: 1,
      created_at: '2026-11-13T01:00:00.000Z',
      updated_at: '2026-11-13T01:00:00.000Z'
    },
    {
      error_id: 10,
      domain_id: 4,
      tech_stack: 'Web API / CORS',
      error_signature: "Access to fetch at origin has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header",
      signature_hash: '5a58e7bd0031b6b11266738cbb39c02b844053014ec9b0d999576487e6e570f9',
      root_cause: 'Backend server lacks appropriate Cross-Origin Resource Sharing response headers.',
      fix_requirements: '1. Install cors package: npm install cors\n2. Add middleware before routes: app.use(cors({ origin: "http://localhost:3000", credentials: true }));\n3. Handle preflight OPTIONS requests.',
      source: 'manual',
      is_verified: 1,
      times_hit: 15,
      is_demo: 1,
      created_at: '2026-11-13T01:00:00.000Z',
      updated_at: '2026-11-13T01:00:00.000Z'
    },
    {
      error_id: 11,
      domain_id: 4,
      tech_stack: 'Auth / JWT',
      error_signature: 'JsonWebTokenError: invalid signature',
      signature_hash: '7a8ea0f68c7e53043c0a74f4e5182e9d5fca19f852091e2fff4203c202e9f6da',
      root_cause: 'JWT signed with a different secret key than the verification algorithm expects, or secret is undefined.',
      fix_requirements: '1. Verify JWT_SECRET is loaded from process.env before jwt.verify() is executed.\n2. Ensure symmetric algorithm (HS256) is consistently specified on sign and verify.',
      source: 'ai',
      is_verified: 1,
      times_hit: 6,
      is_demo: 1,
      created_at: '2026-11-13T01:00:00.000Z',
      updated_at: '2026-11-13T01:00:00.000Z'
    },
    {
      error_id: 12,
      domain_id: 4,
      tech_stack: 'Next.js',
      error_signature: 'Error: Text content does not match server-rendered HTML (Hydration failed)',
      signature_hash: '85f20b52798fd4409df87a88816ac12cee783c108d4fc04bea84394121f9dcae',
      root_cause: 'Component rendered different HTML output on server vs client (e.g. typeof window or Date.now()).',
      fix_requirements: '1. Defer client-only rendering using useEffect or dynamic import with ssr: false.\n2. Avoid browser-only APIs (localStorage, navigator) during initial component render.',
      source: 'ai',
      is_verified: 1,
      times_hit: 11,
      is_demo: 1,
      created_at: '2026-11-13T01:00:00.000Z',
      updated_at: '2026-11-13T01:00:00.000Z'
    }
  ];

  // Sample Presets for AI Scanner quick testing
  const SAMPLE_PRESETS = {
    react_map: {
      domain_id: '1',
      tech: 'React',
      trace: `TypeError: Cannot read properties of undefined (reading 'map')
    at ProductList (ProductList.jsx:14:22)
    at renderWithHooks (react-dom.development.js:14985:18)
    at mountIndeterminateComponent (react-dom.development.js:17811:13)`
    },
    js_const: {
      domain_id: '1',
      tech: 'JavaScript',
      trace: `Uncaught TypeError: Assignment to constant variable.
    at calculateTotal (checkout.js:42:11)
    at HTMLButtonElement.dispatch (jquery.js:5429:27)`
    },
    node_eaddrinuse: {
      domain_id: '2',
      tech: 'Node.js',
      trace: `events.js:377
      throw er; // Unhandled 'error' event
      ^
Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (net.js:1331:16)
    at listenInCluster (net.js:1379:12)`
    },
    express_headers: {
      domain_id: '2',
      tech: 'Express',
      trace: `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
    at ServerResponse.setHeader (_http_outgoing.js:561:11)
    at ServerResponse.header (express/lib/response.js:771:10)
    at res.send (express/lib/response.js:170:12)
    at authController (controllers/auth.js:48:9)`
    },
    mysql_1452: {
      domain_id: '3',
      tech: 'MySQL',
      trace: `Error 1452: Cannot add or update a child row: a foreign key constraint fails
(\`tracevault\`.\`error_logs\`, CONSTRAINT \`fk_error_domain\` FOREIGN KEY (\`domain_id\`) REFERENCES \`domains\` (\`domain_id\`) ON UPDATE CASCADE ON DELETE RESTRICT)`
    },
    cors_error: {
      domain_id: '4',
      tech: 'Web API / CORS',
      trace: `Access to fetch at 'http://api.local/data' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
    }
  };

  // =====================================================================
  // DOM ELEMENT SELECTORS
  // =====================================================================
  const el = {
    // Header
    mysqlStatusTrigger: document.getElementById('mysql-status-trigger'),
    mysqlStatusDot: document.getElementById('mysql-status-dot'),
    mysqlStatusText: document.getElementById('mysql-status-text'),
    globalSearchInput: document.getElementById('global-search-input'),
    exportDropdownBtn: document.getElementById('export-dropdown-btn'),
    exportMenu: document.getElementById('export-menu'),
    exportJsonBtn: document.getElementById('export-json-btn'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    openByokModalBtn: document.getElementById('open-byok-modal-btn'),
    byokStatusPill: document.getElementById('byok-status-pill'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeIcon: document.getElementById('theme-icon'),

    // Real Workspace KPI Cards
    kpiTotalErrors: document.getElementById('kpi-total-errors'),
    kpiTotalHits: document.getElementById('kpi-total-hits'),
    kpiAvgHits: document.getElementById('kpi-avg-hits'),
    kpiMaxHits: document.getElementById('kpi-max-hits'),
    kpiMinHits: document.getElementById('kpi-min-hits'),
    kpiTopBugName: document.getElementById('kpi-top-bug-name'),
    kpiTopBugStack: document.getElementById('kpi-top-bug-stack'),
    kpiTopBugHits: document.getElementById('kpi-top-bug-hits'),
    domainPillsContainer: document.getElementById('domain-pills-container'),

    // Workspace Tabs
    btnTabScanner: document.getElementById('btn-tab-scanner'),
    btnTabManual: document.getElementById('btn-tab-manual'),
    tabScanner: document.getElementById('tab-ai-scanner'),
    tabManual: document.getElementById('tab-manual-entry'),
    sampleErrorSelect: document.getElementById('sample-error-select'),

    // AI Scanner Form
    aiScannerForm: document.getElementById('ai-scanner-form'),
    scanDomainSelect: document.getElementById('scan-domain-select'),
    scanTechInput: document.getElementById('scan-tech-input'),
    scanTraceTextarea: document.getElementById('scan-trace-textarea'),
    btnScanAnalyze: document.getElementById('btn-scan-analyze'),
    scanSpinner: document.getElementById('scan-spinner'),
    btnClearScan: document.getElementById('btn-clear-scan'),
    scannerResultBox: document.getElementById('scanner-result-box'),
    resultSourceBadge: document.getElementById('result-source-badge'),
    resSignature: document.getElementById('res-signature'),
    resRootCause: document.getElementById('res-root-cause'),
    resFixSteps: document.getElementById('res-fix-steps'),
    btnCopyResultFix: document.getElementById('btn-copy-result-fix'),
    btnSendToChat: document.getElementById('btn-send-to-chat'),

    // Manual Entry Form
    manualEntryForm: document.getElementById('manual-entry-form'),
    manualDomainSelect: document.getElementById('manual-domain-select'),
    manualTechInput: document.getElementById('manual-tech-input'),
    manualSignatureInput: document.getElementById('manual-signature-input'),
    manualCauseInput: document.getElementById('manual-cause-input'),
    manualFixTextarea: document.getElementById('manual-fix-textarea'),
    manualVerifiedCheck: document.getElementById('manual-verified-check'),

    // Debug Bot Chat
    activeContextBar: document.getElementById('active-context-bar'),
    activeContextName: document.getElementById('active-context-name'),
    btnDetachContext: document.getElementById('btn-detach-context'),
    btnClearChat: document.getElementById('btn-clear-chat'),
    chatMessages: document.getElementById('chat-messages'),
    chatInputForm: document.getElementById('chat-input-form'),
    chatUserInput: document.getElementById('chat-user-input'),

    // Real Table & Filters
    recordsCounterBadge: document.getElementById('records-counter-badge'),
    filterSearch: document.getElementById('filter-search'),
    filterDomain: document.getElementById('filter-domain'),
    filterTech: document.getElementById('filter-tech'),
    filterVerified: document.getElementById('filter-verified'),
    filterSort: document.getElementById('filter-sort'),
    btnResetFilters: document.getElementById('btn-reset-filters'),
    vaultTableBody: document.getElementById('vault-table-body'),
    tableEmptyState: document.getElementById('table-empty-state'),

    // Lab Demo Sandbox Modal Elements
    openLabModalBtn: document.getElementById('open-lab-modal-btn'),
    modalLabSandbox: document.getElementById('modal-lab-sandbox'),
    btnCloseLabModal: document.getElementById('btn-close-lab-modal'),
    btnCloseLabFooter: document.getElementById('btn-close-lab-footer'),
    btnLabReset: document.getElementById('btn-lab-reset'),
    labKpiTotal: document.getElementById('lab-kpi-total'),
    labKpiHits: document.getElementById('lab-kpi-hits'),
    labKpiAvg: document.getElementById('lab-kpi-avg'),
    labKpiMax: document.getElementById('lab-kpi-max'),
    labKpiMin: document.getElementById('lab-kpi-min'),
    labKpiTopName: document.getElementById('lab-kpi-top-name'),
    labKpiTopStack: document.getElementById('lab-kpi-top-stack'),
    labKpiTopHits: document.getElementById('lab-kpi-top-hits'),
    labQuickAddForm: document.getElementById('lab-quick-add-form'),
    labAddDomain: document.getElementById('lab-add-domain'),
    labAddTech: document.getElementById('lab-add-tech'),
    labAddSignature: document.getElementById('lab-add-signature'),
    labAddCause: document.getElementById('lab-add-cause'),
    labAddFix: document.getElementById('lab-add-fix'),
    labFilterSearch: document.getElementById('lab-filter-search'),
    labFilterDomain: document.getElementById('lab-filter-domain'),
    labFilterSort: document.getElementById('lab-filter-sort'),
    btnLabResetFilters: document.getElementById('btn-lab-reset-filters'),
    labTableBody: document.getElementById('lab-table-body'),

    // Edit Modal
    modalEditRecord: document.getElementById('modal-edit-record'),
    btnCloseEditModal: document.getElementById('btn-close-edit-modal'),
    btnCancelEdit: document.getElementById('btn-cancel-edit'),
    editRecordForm: document.getElementById('edit-record-form'),
    editErrorId: document.getElementById('edit-error-id'),
    editErrorMode: document.getElementById('edit-error-mode'),
    editDomainSelect: document.getElementById('edit-domain-select'),
    editTechInput: document.getElementById('edit-tech-input'),
    editSignatureInput: document.getElementById('edit-signature-input'),
    editCauseInput: document.getElementById('edit-cause-input'),
    editFixTextarea: document.getElementById('edit-fix-textarea'),
    editVerifiedCheck: document.getElementById('edit-verified-check'),

    // Delete Modal
    modalDeleteConfirm: document.getElementById('modal-delete-confirm'),
    btnCloseDeleteModal: document.getElementById('btn-close-delete-modal'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),
    deletePreviewSignature: document.getElementById('delete-preview-signature'),
    deletePreviewId: document.getElementById('delete-preview-id'),

    // BYOK Modal
    modalByokConfig: document.getElementById('modal-byok-config'),
    btnCloseByokModal: document.getElementById('btn-close-byok-modal'),
    byokBtnLabel: document.getElementById('byok-btn-label'),
    byokKeyInput: document.getElementById('byok-key-input'),
    byokDetectedBadge: document.getElementById('byok-detected-badge'),
    btnToggleKeyVisibility: document.getElementById('btn-toggle-key-visibility'),
    btnTestAiKey: document.getElementById('btn-test-ai-key'),
    testKeyResult: document.getElementById('test-key-result'),
    btnSaveByok: document.getElementById('btn-save-byok'),
    btnClearByok: document.getElementById('btn-clear-byok'),

    // MySQL Sync & Inspector Modal
    modalMysqlSync: document.getElementById('modal-mysql-sync'),
    btnCloseMysqlModal: document.getElementById('btn-close-mysql-modal'),
    btnCloseMysqlFooter: document.getElementById('btn-close-mysql-footer'),
    btnRunSqlPing: document.getElementById('btn-run-sql-ping'),
    sqlPingLatency: document.getElementById('sql-ping-latency'),
    sqlPingResult: document.getElementById('sql-ping-result'),
    modalDbStatusBadge: document.getElementById('modal-db-status-badge'),
    inspectHost: document.getElementById('inspect-host'),
    inspectDb: document.getElementById('inspect-db'),
    inspectDriver: document.getElementById('inspect-driver'),
    inspectNorm: document.getElementById('inspect-norm'),

    toastContainer: document.getElementById('toast-container')
  };

  // =====================================================================
  // INITIALIZATION
  // =====================================================================
  async function init() {
    initTheme();
    initByokStatus();
    initStaticStorageIfMissing();
    attachEventListeners();

    // Check backend connection
    await checkDatabaseHealth();
    await fetchDomains();

    // Load Real Workspace (starts clean at 0 bugs)
    await fetchStats('real');
    await fetchErrors('real');

    restoreActiveContext();
  }

  // =====================================================================
  // STATIC STORAGE ENGINE (Client-side fallback for GitHub Pages)
  // =====================================================================
  function initStaticStorageIfMissing() {
    if (!localStorage.getItem('tv_static_demo_errors')) {
      localStorage.setItem('tv_static_demo_errors', JSON.stringify(SEED_DEMO_RECORDS));
    }
    if (!localStorage.getItem('tv_static_real_errors')) {
      localStorage.setItem('tv_static_real_errors', JSON.stringify([]));
    }
  }

  function getStaticRecords(mode) {
    const key = mode === 'real' ? 'tv_static_real_errors' : 'tv_static_demo_errors';
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveStaticRecords(mode, records) {
    const key = mode === 'real' ? 'tv_static_real_errors' : 'tv_static_demo_errors';
    localStorage.setItem(key, JSON.stringify(records));
  }

  function computeStaticStats(records) {
    const total_errors = records.length;
    const total_hits = records.reduce((acc, r) => acc + (parseInt(r.times_hit, 10) || 0), 0);
    const avg_hits = total_errors > 0 ? (total_hits / total_errors).toFixed(1) : '0.0';
    const hitValues = records.map(r => parseInt(r.times_hit, 10) || 0);
    const max_hits = hitValues.length > 0 ? Math.max(...hitValues) : 0;
    const min_hits = hitValues.length > 0 ? Math.min(...hitValues) : 0;

    let top_bug = null;
    if (total_errors > 0) {
      const sorted = [...records].sort((a, b) => (b.times_hit || 0) - (a.times_hit || 0));
      top_bug = sorted[0];
    }

    const domain_breakdown = state.domains.map(d => {
      const domErrors = records.filter(r => r.domain_id === d.domain_id);
      const domHits = domErrors.reduce((acc, r) => acc + (parseInt(r.times_hit, 10) || 0), 0);
      return {
        domain_id: d.domain_id,
        domain_name: d.domain_name,
        total_errors: domErrors.length,
        total_hits: domHits
      };
    });

    return {
      mode: 'static',
      aggregates: { total_errors, total_hits, avg_hits, max_hits, min_hits },
      top_bug,
      domain_breakdown
    };
  }

  function filterStaticRecords(records, filters) {
    let out = [...records];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      out = out.filter(r =>
        (r.error_signature && r.error_signature.toLowerCase().includes(q)) ||
        (r.tech_stack && r.tech_stack.toLowerCase().includes(q)) ||
        (r.root_cause && r.root_cause.toLowerCase().includes(q))
      );
    }
    if (filters.domain_id && filters.domain_id !== 'all') {
      out = out.filter(r => r.domain_id === parseInt(filters.domain_id, 10));
    }
    if (filters.tech_stack) {
      const q = filters.tech_stack.toLowerCase();
      out = out.filter(r => r.tech_stack && r.tech_stack.toLowerCase().includes(q));
    }
    if (filters.verified && filters.verified !== 'all') {
      const v = filters.verified === '1' ? 1 : 0;
      out = out.filter(r => (r.is_verified ? 1 : 0) === v);
    }

    if (filters.sort === 'hits') {
      out.sort((a, b) => (b.times_hit || 0) - (a.times_hit || 0));
    } else if (filters.sort === 'updated') {
      out.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
    } else if (filters.sort === 'id_asc') {
      out.sort((a, b) => a.error_id - b.error_id);
    } else {
      out.sort((a, b) => b.error_id - a.error_id);
    }

    return out;
  }

  // =====================================================================
  // THEME MANAGEMENT
  // =====================================================================
  function initTheme() {
    const savedTheme = localStorage.getItem('tv_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('tv_theme', next);
    updateThemeIcon(next);
    showToast(`Switched to ${next} mode`, 'info');
  }

  function updateThemeIcon(theme) {
    if (el.themeIcon) {
      el.themeIcon.textContent = theme === 'dark' ? '🌓' : '☀️';
    }
  }

  // =====================================================================
  // TOAST NOTIFICATIONS
  // =====================================================================
  function showToast(message, type = 'info', duration = 3500) {
    if (!el.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHTML(message)}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // =====================================================================
  // SANITIZATION
  // =====================================================================
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // =====================================================================
  // API COMMUNICATIONS & DATABASE HEALTH
  // =====================================================================
  async function checkDatabaseHealth() {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('API offline');
      const data = await res.json();
      state.isStaticMode = false;

      if (data.db_connected) {
        if (el.mysqlStatusTrigger) {
          el.mysqlStatusTrigger.classList.add('connected');
          el.mysqlStatusText.textContent = '● MySQL 3306 Live';
          el.mysqlStatusTrigger.title = 'MySQL 8+ Connected on Port 3306';
        }
      } else {
        if (el.mysqlStatusTrigger) {
          el.mysqlStatusTrigger.classList.remove('connected');
          el.mysqlStatusText.textContent = '⚡ Sync MySQL';
          el.mysqlStatusTrigger.title = 'Running on Local Disk. Click to see MySQL connection setup.';
        }
      }
      return data;
    } catch (e) {
      state.isStaticMode = true;
      if (el.mysqlStatusTrigger) {
        el.mysqlStatusTrigger.classList.remove('connected');
        el.mysqlStatusText.textContent = '⚡ Client Storage';
        el.mysqlStatusTrigger.title = 'Static Browser Storage Mode';
      }
      return { db_connected: false, static: true };
    }
  }

  async function fetchDomains() {
    if (state.isStaticMode) return;
    try {
      const res = await fetch('/api/domains');
      const json = await res.json();
      if (json.success && json.data) {
        state.domains = json.data;
      }
    } catch (e) {
      // Use pre-configured domains
    }
  }

  async function fetchStats(mode = 'real') {
    if (state.isStaticMode) {
      const records = getStaticRecords(mode);
      const stats = computeStaticStats(records);
      if (mode === 'real') {
        state.real.stats = stats;
        renderRealStats(stats);
      } else {
        state.demo.stats = stats;
        renderDemoStats(stats);
      }
      return;
    }

    try {
      const res = await fetch(`/api/stats?mode=${mode}`);
      const json = await res.json();
      if (json.success && json.data) {
        if (mode === 'real') {
          state.real.stats = json.data;
          renderRealStats(json.data);
        } else {
          state.demo.stats = json.data;
          renderDemoStats(json.data);
        }
      }
    } catch (e) {
      state.isStaticMode = true;
      fetchStats(mode);
    }
  }

  async function fetchErrors(mode = 'real') {
    const filterObj = mode === 'real' ? state.real.filters : state.demo.filters;

    if (state.isStaticMode) {
      const records = getStaticRecords(mode);
      const filtered = filterStaticRecords(records, filterObj);
      if (mode === 'real') {
        state.real.errors = filtered;
        renderRealTable(filtered);
      } else {
        state.demo.errors = filtered;
        renderDemoTable(filtered);
      }
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('mode', mode);

      if (filterObj.search) params.append('search', filterObj.search);
      if (filterObj.domain_id && filterObj.domain_id !== 'all') params.append('domain_id', filterObj.domain_id);
      if (filterObj.tech_stack) params.append('tech_stack', filterObj.tech_stack);
      if (filterObj.verified && filterObj.verified !== 'all') params.append('verified', filterObj.verified);
      if (filterObj.sort) params.append('sort', filterObj.sort);

      const res = await fetch(`/api/errors?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        if (mode === 'real') {
          state.real.errors = json.data;
          renderRealTable(json.data);
        } else {
          state.demo.errors = json.data;
          renderDemoTable(json.data);
        }
      }
    } catch (e) {
      state.isStaticMode = true;
      fetchErrors(mode);
    }
  }

  // =====================================================================
  // REAL WORKSPACE DOM RENDERING (STARTS AT 0)
  // =====================================================================
  function renderRealStats(data) {
    const agg = data.aggregates || {};
    el.kpiTotalErrors.textContent = agg.total_errors ?? 0;
    el.kpiTotalHits.textContent = agg.total_hits ?? 0;
    el.kpiAvgHits.textContent = agg.avg_hits ?? '0.0';
    el.kpiMaxHits.textContent = agg.max_hits ?? 0;
    el.kpiMinHits.textContent = agg.min_hits ?? 0;

    if (data.top_bug && agg.total_errors > 0) {
      el.kpiTopBugName.textContent = data.top_bug.error_signature;
      el.kpiTopBugName.title = data.top_bug.error_signature;
      el.kpiTopBugStack.textContent = data.top_bug.tech_stack;
      el.kpiTopBugHits.textContent = `🔥 ${data.top_bug.times_hit} hits`;
    } else {
      el.kpiTopBugName.textContent = 'No bugs recorded yet';
      el.kpiTopBugStack.textContent = '-';
      el.kpiTopBugHits.textContent = '0 hits';
    }

    // Render interactive domain breakdown pills
    if (data.domain_breakdown && Array.isArray(data.domain_breakdown)) {
      el.domainPillsContainer.innerHTML = '';
      data.domain_breakdown.forEach(d => {
        const pill = document.createElement('button');
        const isActive = state.real.filters.domain_id === String(d.domain_id);
        pill.className = `domain-pill-btn ${isActive ? 'active' : ''}`;
        pill.innerHTML = `
          <span>${escapeHTML(d.domain_name)}</span>
          <span class="pill-count">${d.total_errors} bugs &bull; ${d.total_hits} hits</span>
        `;
        pill.addEventListener('click', () => {
          if (state.real.filters.domain_id === String(d.domain_id)) {
            state.real.filters.domain_id = 'all';
            el.filterDomain.value = 'all';
          } else {
            state.real.filters.domain_id = String(d.domain_id);
            el.filterDomain.value = String(d.domain_id);
          }
          fetchErrors('real');
          fetchStats('real');
        });
        el.domainPillsContainer.appendChild(pill);
      });
    }
  }

  function renderRealTable(records) {
    el.recordsCounterBadge.textContent = `${records.length} records loaded`;

    if (!records || records.length === 0) {
      el.vaultTableBody.innerHTML = '';
      el.tableEmptyState.classList.remove('hidden');
      return;
    }

    el.tableEmptyState.classList.add('hidden');
    el.vaultTableBody.innerHTML = records.map(r => generateTableRowHtml(r, 'real')).join('');
  }

  // =====================================================================
  // LAB DEMO SANDBOX DOM RENDERING (is_demo = 1)
  // =====================================================================
  function renderDemoStats(data) {
    const agg = data.aggregates || {};
    el.labKpiTotal.textContent = agg.total_errors ?? 12;
    el.labKpiHits.textContent = agg.total_hits ?? 87;
    el.labKpiAvg.textContent = agg.avg_hits ?? '7.3';
    el.labKpiMax.textContent = agg.max_hits ?? 15;
    el.labKpiMin.textContent = agg.min_hits ?? 2;

    if (data.top_bug) {
      el.labKpiTopName.textContent = data.top_bug.error_signature;
      el.labKpiTopName.title = data.top_bug.error_signature;
      el.labKpiTopStack.textContent = data.top_bug.tech_stack;
      el.labKpiTopHits.textContent = `🔥 ${data.top_bug.times_hit} hits`;
    }
  }

  function renderDemoTable(records) {
    if (!records || records.length === 0) {
      el.labTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">No demo records found. Click '↻ Reset Demo Data' to restore default sample records.</td></tr>`;
      return;
    }

    el.labTableBody.innerHTML = records.map(r => generateTableRowHtml(r, 'demo')).join('');
  }

  function generateTableRowHtml(r, mode) {
    const domainName = r.domain_name || (state.domains.find(d => d.domain_id === r.domain_id)?.domain_name) || 'General';
    const isVerified = r.is_verified === 1 || r.is_verified === true;
    const sourceClass = r.source === 'ai' ? 'badge-source-ai' : r.source === 'edited' ? 'badge-source-edited' : 'badge-source-manual';

    return `
      <tr data-id="${r.error_id}" data-mode="${mode}">
        <td class="cell-id">#${r.error_id}</td>
        <td>
          <span class="badge badge-domain" data-domain="${r.domain_id}">
            ${escapeHTML(domainName)}
          </span>
        </td>
        <td>
          <span class="cell-stack">${escapeHTML(r.tech_stack)}</span>
        </td>
        <td>
          <div class="cell-signature-title" title="${escapeHTML(r.error_signature)}">
            ${escapeHTML(r.error_signature)}
          </div>
          ${r.root_cause ? `<div class="cell-root-cause">${escapeHTML(r.root_cause)}</div>` : ''}
        </td>
        <td>
          <div class="cell-fix code-font">${escapeHTML(r.fix_requirements)}</div>
        </td>
        <td>
          <span class="badge-source ${sourceClass}">${escapeHTML(r.source)}</span>
          <div 
            class="badge-verified-toggle ${isVerified ? 'verified' : 'unverified'}" 
            data-action="toggle-verify" 
            data-id="${r.error_id}"
            data-mode="${mode}"
            title="Click to toggle verified status"
          >
            ${isVerified ? '✓ Verified' : '⏳ Review'}
          </div>
        </td>
        <td class="hits-cell">
          <span class="hits-badge" id="hit-badge-${mode}-${r.error_id}">${r.times_hit}</span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-xs btn-primary" data-action="hit" data-id="${r.error_id}" data-mode="${mode}" title="Atomic +1 Hit">
              +1 Hit
            </button>
            ${mode === 'real' ? `
            <button class="btn btn-xs btn-secondary" data-action="chat" data-id="${r.error_id}" data-mode="${mode}" title="Ask Debug Bot about this bug">
              💬 Chat
            </button>` : ''}
            <button class="btn btn-xs btn-outline" data-action="copy" data-id="${r.error_id}" data-mode="${mode}" title="Copy signature and fix">
              📋
            </button>
            <button class="btn btn-xs btn-secondary" data-action="edit" data-id="${r.error_id}" data-mode="${mode}" title="Edit record in modal">
              ✏️
            </button>
            <button class="btn btn-xs btn-danger" data-action="delete" data-id="${r.error_id}" data-mode="${mode}" title="Delete record with confirmation">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  // =====================================================================
  // KEY PREFIX AUTO-DETECTOR
  // =====================================================================
  function detectProviderFromKey(key) {
    if (!key) return null;
    const cleanKey = key.trim();
    if (cleanKey.startsWith('AIza')) {
      return { provider: 'gemini', model: 'gemini-2.5-flash', fallback: 'gemini-1.5-flash', label: 'Google Gemini' };
    }
    if (cleanKey.startsWith('gsk_')) {
      return { provider: 'groq', model: 'llama-3.3-70b-versatile', fallback: 'llama3-70b-8192', label: 'Groq' };
    }
    if (cleanKey.startsWith('sk-or-')) {
      return { provider: 'openrouter', model: 'deepseek/deepseek-r1:free', fallback: 'meta-llama/llama-3.3-70b-instruct:free', label: 'OpenRouter' };
    }
    if (cleanKey.startsWith('sk-')) {
      return { provider: 'openai', model: 'gpt-4o-mini', fallback: 'gpt-3.5-turbo', label: 'OpenAI' };
    }
    return null;
  }

  function handleKeyInput() {
    if (!el.byokKeyInput) return;
    const key = el.byokKeyInput.value.trim();
    const detected = detectProviderFromKey(key);
    if (!el.byokDetectedBadge) return;
    if (detected) {
      el.byokDetectedBadge.textContent = `✓ Auto-detected: ${detected.label}`;
      el.byokDetectedBadge.className = 'detected-badge';
      el.byokDetectedBadge.style.display = 'inline-block';
    } else if (key) {
      el.byokDetectedBadge.textContent = 'Universal API Key';
      el.byokDetectedBadge.className = 'detected-badge';
      el.byokDetectedBadge.style.display = 'inline-block';
    } else {
      el.byokDetectedBadge.textContent = '';
      el.byokDetectedBadge.style.display = 'none';
    }
  }

  // =====================================================================
  // BULLETPROOF BYOK AI ENGINE (AUTO-RETRY CHAIN & FAULT-TOLERANT PARSER)
  // =====================================================================
  async function callAiProviderWithFallback(domainId, techStack, trace) {
    const apiKey = localStorage.getItem('tv_ai_key');

    // Offline / No Key Fallback
    if (!apiKey || apiKey.trim() === '') {
      return runHeuristicDiagnosis(domainId, techStack, trace);
    }

    let provider = localStorage.getItem('tv_ai_provider');
    let chosenModel = localStorage.getItem('tv_ai_model');
    if (!provider) {
      const detected = detectProviderFromKey(apiKey);
      provider = detected ? detected.provider : 'gemini';
      chosenModel = detected ? detected.model : 'gemini-2.5-flash';
    } else if (!chosenModel) {
      chosenModel = PROVIDER_DEFAULTS[provider] || 'gemini-2.5-flash';
    }

    const chain = MODEL_FALLBACK_CHAINS[provider] || [chosenModel];
    // Put user chosen model first in retry sequence
    const modelsToTry = [chosenModel, ...chain.filter(m => m !== chosenModel)];

    let lastError = null;
    for (const model of modelsToTry) {
      try {
        return await invokeSingleModelApi(provider, model, apiKey, domainId, techStack, trace);
      } catch (err) {
        lastError = err;
        console.warn(`[TraceVault BYOK] Model '${model}' failed: ${err.message}. Retrying fallback chain...`);
        // If credentials are fundamentally invalid (401/403), stop retrying same key
        if (err.status === 401 || err.status === 403) break;
      }
    }

    // Fall back to built-in heuristic engine
    console.warn('[TraceVault BYOK] All models failed or rate-limited. Falling back to local heuristic analyzer.');
    showToast(`AI note: ${lastError?.message || 'API error'}. Switched to local heuristic analysis.`, 'info');
    return runHeuristicDiagnosis(domainId, techStack, trace);
  }

  async function invokeSingleModelApi(provider, model, apiKey, domainId, techStack, trace) {
    const domainName = state.domains.find(d => d.domain_id === parseInt(domainId, 10))?.domain_name || 'Fullstack';
    const systemPrompt = `You are an expert ${domainName} debugging engineer for TraceVault. Analyze the following broken code / stack trace for ${techStack}. Output STRICT JSON only with keys: "tech_stack", "error_signature" (concise canonical 1-line error headline), "root_cause" (concise 1-sentence cause), and "fix_requirements" (numbered step-by-step actionable fix).`;
    const userPrompt = `Tech Stack: ${techStack}\nDomain: ${domainName}\nTrace/Code:\n${trace}`;

    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}\n\nReturn strict JSON only.` }] }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const err = new Error(errData.error?.message || `Gemini returned HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return parseFaultTolerantJson(text, techStack, trace);
    }

    // OpenAI, Groq, OpenRouter API standard
    let endpoint = 'https://api.openai.com/v1/chat/completions';
    if (provider === 'groq') endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    if (provider === 'openrouter') endpoint = 'https://openrouter.ai/api/v1/chat/completions';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'TraceVault'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const err = new Error(errData.error?.message || `${provider.toUpperCase()} returned HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    return parseFaultTolerantJson(content, techStack, trace);
  }

  /**
   * Fault-Tolerant JSON Parser:
   * Strips DeepSeek-R1 <think>...</think> reasoning tags, markdown fences, and parses JSON.
   */
  function parseFaultTolerantJson(rawText, fallbackStack, fallbackTrace) {
    if (!rawText) throw new Error('Empty AI response.');
    let clean = String(rawText).trim();

    // Strip DeepSeek-R1 <think>...</think> reasoning tags
    clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // Strip markdown code fences
    clean = clean.replace(/^```json\s*/i, '')
                 .replace(/^```\s*/i, '')
                 .replace(/```$/i, '')
                 .trim();

    // Attempt to extract outer JSON object if conversational wrapper exists
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return {
          tech_stack: parsed.tech_stack || fallbackStack,
          error_signature: parsed.error_signature || fallbackTrace.split('\n')[0].substring(0, 120),
          root_cause: parsed.root_cause || 'Root cause analyzed by TraceVault AI.',
          fix_requirements: parsed.fix_requirements || '1. Verify variable references.\n2. Add guard clauses.\n3. Re-test execution.'
        };
      } catch (e) {
        // Fall through
      }
    }

    try {
      const parsed = JSON.parse(clean);
      return {
        tech_stack: parsed.tech_stack || fallbackStack,
        error_signature: parsed.error_signature || fallbackTrace.split('\n')[0].substring(0, 120),
        root_cause: parsed.root_cause || 'Root cause analyzed by TraceVault AI.',
        fix_requirements: parsed.fix_requirements || '1. Verify variable references.\n2. Add guard clauses.\n3. Re-test execution.'
      };
    } catch (e) {
      return {
        tech_stack: fallbackStack,
        error_signature: fallbackTrace.split('\n')[0].substring(0, 120),
        root_cause: 'Runtime exception analyzed by TraceVault reasoning engine.',
        fix_requirements: clean.length > 25 ? clean : '1. Review syntax around the identified stack trace line.\n2. Ensure all referenced variables exist in scope.\n3. Wrap risky operations in try-catch.'
      };
    }
  }

  // =====================================================================
  // OFFLINE HEURISTIC ANALYZER (No API Key Required)
  // =====================================================================
  function runHeuristicDiagnosis(domainId, techStack, trace) {
    const lines = trace.split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] || 'Unknown Exception';

    let sig = firstLine.substring(0, 140);
    let cause = 'Unexpected runtime condition encountered in execution context.';
    let fix = '1. Check variable references and parameters.\n2. Inspect console or debug logs for stack trace pointers.\n3. Re-verify asynchronous call order.';

    if (trace.includes('reading \'map\'') || trace.includes('cannot read property')) {
      sig = "Cannot read properties of undefined (reading 'map')";
      cause = 'Attempting to call array mapping method on an undefined or null state object.';
      fix = '1. Initialize component state with default array: useState([])\n2. Guard with optional chaining: items?.map(...)\n3. Verify data payload structure before invoking mapping methods.';
    } else if (trace.includes('EADDRINUSE')) {
      sig = 'Error: listen EADDRINUSE: address already in use :::3000';
      cause = 'Target network port is already allocated by another running server instance.';
      fix = '1. Kill lingering process: npx kill-port 3000\n2. Assign an alternative port using process.env.PORT\n3. Implement graceful server shutdown hooks.';
    } else if (trace.includes('CORS') || trace.includes('Access-Control-Allow-Origin')) {
      sig = 'Blocked by CORS policy: No Access-Control-Allow-Origin header present';
      cause = 'Browser Cross-Origin Resource Sharing security blocks request lacking server authorization headers.';
      fix = '1. Install cors middleware: npm install cors\n2. Add app.use(cors({ origin: "http://localhost:3000" })) before API route declarations.\n3. Ensure response status 200 on preflight OPTIONS requests.';
    } else if (trace.includes('1452') || trace.includes('foreign key constraint')) {
      sig = 'Error 1452: Cannot add or update a child row: a foreign key constraint fails';
      cause = 'Referenced foreign key value does not exist in the designated parent table.';
      fix = '1. Ensure parent entity is inserted before inserting dependent child record.\n2. Confirm matching data types and sign attributes between primary and foreign key columns.\n3. Verify foreign key constraint name and referenced column definitions.';
    } else if (trace.includes('constant variable')) {
      sig = 'Uncaught TypeError: Assignment to constant variable';
      cause = 'Direct reassignment attempted on an identifier declared via const.';
      fix = '1. Change declaration from const to let if variable mutation is intended.\n2. If operating on objects or arrays, mutate object properties rather than reassigning reference.';
    } else if (trace.includes('ERR_HTTP_HEADERS_SENT')) {
      sig = 'Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client';
      cause = 'Multiple response dispatch calls executed within the same HTTP request handler lifecycle.';
      fix = '1. Add immediate return statement to exit handler branch: return res.status(400).json(...);\n2. Avoid calling next() following response header transmission.';
    }

    return {
      tech_stack: techStack,
      error_signature: sig,
      root_cause: cause,
      fix_requirements: fix
    };
  }

  // =====================================================================
  // BYOK CLIENT-SIDE AI SCANNER & MEMORY LOOKUP (REAL WORKSPACE)
  // =====================================================================
  async function handleAiScan(e) {
    e.preventDefault();
    const domainId = el.scanDomainSelect.value;
    const techStack = el.scanTechInput.value.trim();
    const trace = el.scanTraceTextarea.value.trim();

    if (!techStack || !trace) {
      showToast('Please enter both Tech Stack and Error Trace.', 'error');
      return;
    }

    setScanLoading(true);

    try {
      // Step 1: Memory-First Lookup in Real Vault (0 Tokens Used)
      let matchedRecord = null;
      const firstLine = trace.split('\n')[0].substring(0, 120);

      if (state.isStaticMode) {
        const records = getStaticRecords('real');
        matchedRecord = records.find(rec =>
          trace.toLowerCase().includes(rec.error_signature.toLowerCase()) ||
          rec.error_signature.toLowerCase().includes(firstLine.toLowerCase())
        );
      } else {
        const searchRes = await fetch(`/api/errors?mode=real&domain_id=${domainId}&search=${encodeURIComponent(techStack)}`);
        const searchJson = await searchRes.json();
        if (searchJson.success && searchJson.data.length > 0) {
          matchedRecord = searchJson.data.find(rec =>
            trace.toLowerCase().includes(rec.error_signature.toLowerCase()) ||
            rec.error_signature.toLowerCase().includes(firstLine.toLowerCase())
          );
        }
      }

      if (matchedRecord) {
        // Found in Real Memory! Increment hit
        await incrementHit(matchedRecord.error_id, 'real');
        displayScanResult({
          source: 'memory',
          error_signature: matchedRecord.error_signature,
          root_cause: matchedRecord.root_cause || 'Retrieved from TraceVault memory index.',
          fix_requirements: matchedRecord.fix_requirements,
          matchedRecord: matchedRecord
        });
        showToast('⚡ Retrieved from Vault Memory (0 AI Tokens Used)', 'success');
        await fetchStats('real');
        await fetchErrors('real');
        setActiveContext(matchedRecord);
        setScanLoading(false);
        return;
      }

      // Step 2: Not in Real Memory -> Call BYOK AI or Heuristic Fallback
      const aiResult = await callAiProviderWithFallback(domainId, techStack, trace);

      // Auto-save learned error to Real Vault
      let newId = null;
      if (state.isStaticMode) {
        const records = getStaticRecords('real');
        newId = records.length > 0 ? Math.max(...records.map(r => r.error_id)) + 1 : 1;
        const newRecord = {
          error_id: newId,
          domain_id: parseInt(domainId, 10),
          tech_stack: aiResult.tech_stack || techStack,
          error_signature: aiResult.error_signature,
          signature_hash: 'hash_' + Date.now(),
          root_cause: aiResult.root_cause,
          fix_requirements: aiResult.fix_requirements,
          source: 'ai',
          is_verified: 0,
          times_hit: 1,
          is_demo: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        records.push(newRecord);
        saveStaticRecords('real', records);
      } else {
        const upsertRes = await fetch('/api/errors/ai-upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain_id: parseInt(domainId, 10),
            tech_stack: aiResult.tech_stack || techStack,
            error_signature: aiResult.error_signature,
            root_cause: aiResult.root_cause,
            fix_requirements: aiResult.fix_requirements,
            mode: 'real'
          })
        });
        const upsertJson = await upsertRes.json();
        newId = upsertJson.error_id;
      }

      displayScanResult({
        source: 'ai',
        error_signature: aiResult.error_signature,
        root_cause: aiResult.root_cause,
        fix_requirements: aiResult.fix_requirements,
        error_id: newId
      });

      showToast('🤖 Diagnosed by AI & Auto-Saved to Real Vault', 'success');
      await fetchStats('real');
      await fetchErrors('real');

      // Bind to active bot chat context
      setActiveContext({
        error_id: newId,
        domain_id: parseInt(domainId, 10),
        tech_stack: aiResult.tech_stack || techStack,
        error_signature: aiResult.error_signature,
        root_cause: aiResult.root_cause,
        fix_requirements: aiResult.fix_requirements
      });

    } catch (err) {
      console.error('Scan failed:', err);
      showToast('Scan error: ' + err.message, 'error');
    } finally {
      setScanLoading(false);
    }
  }

  function setScanLoading(isLoading) {
    if (isLoading) {
      el.btnScanAnalyze.disabled = true;
      el.scanSpinner.classList.remove('hidden');
    } else {
      el.btnScanAnalyze.disabled = false;
      el.scanSpinner.classList.add('hidden');
    }
  }

  function displayScanResult(res) {
    el.scannerResultBox.classList.remove('hidden');
    el.resSignature.textContent = res.error_signature;
    el.resRootCause.textContent = res.root_cause;
    el.resFixSteps.textContent = res.fix_requirements;

    if (res.source === 'memory') {
      el.resultSourceBadge.innerHTML = `
        <span class="badge badge-primary">⚡ RETRIEVED FROM VAULT MEMORY</span>
        <span class="badge badge-outline">0 Tokens Used</span>
      `;
    } else {
      el.resultSourceBadge.innerHTML = `
        <span class="badge badge-accent">🤖 ANALYZED BY BYOK AI</span>
        <span class="badge badge-primary">Auto-Saved to Vault</span>
      `;
    }

    el.btnCopyResultFix.onclick = () => {
      navigator.clipboard.writeText(`Error Signature: ${res.error_signature}\n\nFix Requirements:\n${res.fix_requirements}`);
      showToast('Solution copied to clipboard!', 'success');
    };

    el.btnSendToChat.onclick = () => {
      el.chatUserInput.value = `Explain why '${res.error_signature}' occurred and provide prevention tips.`;
      el.chatUserInput.focus();
    };
  }

  // =====================================================================
  // MANUAL ENTRY SUBMISSION
  // =====================================================================
  async function handleManualEntry(e) {
    e.preventDefault();
    const payload = {
      domain_id: parseInt(el.manualDomainSelect.value, 10),
      tech_stack: el.manualTechInput.value.trim(),
      error_signature: el.manualSignatureInput.value.trim(),
      root_cause: el.manualCauseInput.value.trim(),
      fix_requirements: el.manualFixTextarea.value.trim(),
      is_verified: el.manualVerifiedCheck.checked ? 1 : 0,
      mode: 'real'
    };

    if (state.isStaticMode) {
      const records = getStaticRecords('real');
      const newId = records.length > 0 ? Math.max(...records.map(r => r.error_id)) + 1 : 1;
      records.push({
        error_id: newId,
        ...payload,
        signature_hash: 'manual_' + Date.now(),
        source: 'manual',
        times_hit: 1,
        is_demo: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      saveStaticRecords('real', records);
      showToast('Error record logged to Real Vault!', 'success');
      el.manualEntryForm.reset();
      await fetchStats('real');
      await fetchErrors('real');
      return;
    }

    try {
      const res = await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        showToast(json.message || 'Error record logged successfully!', 'success');
        el.manualEntryForm.reset();
        await fetchStats('real');
        await fetchErrors('real');
      } else {
        showToast(json.error || 'Failed to save record', 'error');
      }
    } catch (err) {
      showToast('Network error while saving manual record', 'error');
    }
  }

  // =====================================================================
  // LAB DEMO QUICK ADD SUBMISSION (is_demo = 1)
  // =====================================================================
  async function handleLabQuickAdd(e) {
    e.preventDefault();
    const payload = {
      domain_id: parseInt(el.labAddDomain.value, 10),
      tech_stack: el.labAddTech.value.trim(),
      error_signature: el.labAddSignature.value.trim(),
      root_cause: el.labAddCause.value.trim(),
      fix_requirements: el.labAddFix.value.trim(),
      is_verified: 1,
      mode: 'demo'
    };

    if (state.isStaticMode) {
      const records = getStaticRecords('demo');
      const newId = records.length > 0 ? Math.max(...records.map(r => r.error_id)) + 1 : 1;
      records.push({
        error_id: newId,
        ...payload,
        signature_hash: 'demo_' + Date.now(),
        source: 'manual',
        times_hit: 1,
        is_demo: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      saveStaticRecords('demo', records);
      showToast('Demo record added to Lab Sandbox!', 'success');
      el.labQuickAddForm.reset();
      await fetchStats('demo');
      await fetchErrors('demo');
      return;
    }

    try {
      const res = await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        showToast('Demo record added to Lab Sandbox!', 'success');
        el.labQuickAddForm.reset();
        await fetchStats('demo');
        await fetchErrors('demo');
      } else {
        showToast(json.error || 'Failed to add demo record', 'error');
      }
    } catch (err) {
      showToast('Error adding demo record: ' + err.message, 'error');
    }
  }

  // =====================================================================
  // RESET 12 LAB DEMO RECORDS
  // =====================================================================
  async function resetLabDemoRecords() {
    el.btnLabReset.disabled = true;
    el.btnLabReset.textContent = 'Resetting...';

    if (state.isStaticMode) {
      saveStaticRecords('demo', [...SEED_DEMO_RECORDS]);
      showToast('Demo data reset to default', 'success');
      await fetchStats('demo');
      await fetchErrors('demo');
      el.btnLabReset.disabled = false;
      el.btnLabReset.textContent = '↻ Reset Demo Data';
      return;
    }

    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const json = await res.json();

      if (json.success) {
        showToast('Demo data reset to default', 'success');
        await fetchStats('demo');
        await fetchErrors('demo');
      } else {
        showToast(json.error || 'Reset failed', 'error');
      }
    } catch (e) {
      showToast('Error resetting demo records: ' + e.message, 'error');
    } finally {
      el.btnLabReset.disabled = false;
      el.btnLabReset.textContent = '↻ Reset Demo Data';
    }
  }

  // =====================================================================
  // CONTEXT-AWARE DEBUG BOT CHAT
  // =====================================================================
  function setActiveContext(errorRecord) {
    state.activeError = errorRecord;
    sessionStorage.setItem('tv_active_error', JSON.stringify(errorRecord));
    updateActiveContextUI();
  }

  function restoreActiveContext() {
    try {
      const saved = sessionStorage.getItem('tv_active_error');
      if (saved) {
        state.activeError = JSON.parse(saved);
        updateActiveContextUI();
      }
    } catch (e) {
      // Ignore
    }
  }

  function detachContext() {
    state.activeError = null;
    sessionStorage.removeItem('tv_active_error');
    updateActiveContextUI();
    showToast('Context detached from debug bot', 'info');
  }

  function updateActiveContextUI() {
    if (state.activeError) {
      el.activeContextName.textContent = `[${state.activeError.tech_stack}] ${state.activeError.error_signature}`;
      el.activeContextName.title = state.activeError.error_signature;
      el.btnDetachContext.classList.remove('hidden');
    } else {
      el.activeContextName.textContent = 'None loaded (Select a row or scan an error)';
      el.btnDetachContext.classList.add('hidden');
    }
  }

  async function handleChatSubmit(e) {
    e.preventDefault();
    const message = el.chatUserInput.value.trim();
    if (!message) return;

    appendChatMessage('user', message);
    el.chatUserInput.value = '';

    await generateBotReply(message);
  }

  function appendChatMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role === 'user' ? 'user-message' : 'bot-message'}`;

    const avatar = role === 'user'
      ? '👤'
      : '<img src="app-icon.svg?v=cube_v6" class="bot-avatar-img" alt="TraceVault AI" style="width: 22px; height: 22px; display: block;" />';
    msgDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content markdown-body">
        ${formatChatContent(text)}
      </div>
    `;

    el.chatMessages.appendChild(msgDiv);
    el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
  }

  function formatChatContent(raw) {
    let escaped = escapeHTML(raw);
    escaped = escaped.replace(/```([\s\S]*?)```/g, (match, p1) => `<pre><code>${p1}</code></pre>`);
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\n/g, '<br>');
    return `<p>${escaped}</p>`;
  }

  async function generateBotReply(userPrompt) {
    const active = state.activeError;
    const provider = localStorage.getItem('tv_ai_provider') || 'gemini';
    const model = localStorage.getItem('tv_ai_model') || PROVIDER_DEFAULTS[provider];
    const apiKey = localStorage.getItem('tv_ai_key');

    let botResponse = '';

    if (apiKey && apiKey.trim() !== '') {
      const systemContext = active
        ? `You are TraceVault Debug Assistant. Active context:
- Tech Stack: ${active.tech_stack}
- Error Signature: ${active.error_signature}
- Root Cause: ${active.root_cause}
- Fix Steps: ${active.fix_requirements}
Provide direct, concise code examples and solutions.`
        : `You are TraceVault Debug Assistant, an expert developer troubleshooting guide for DBMS, frontend, backend, and fullstack systems.`;

      try {
        if (provider === 'gemini') {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${systemContext}\n\nUser Question: ${userPrompt}` }] }]
            })
          });
          const json = await res.json();
          botResponse = json.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated from Gemini.';
        } else {
          let ep = 'https://api.openai.com/v1/chat/completions';
          if (provider === 'groq') ep = 'https://api.groq.com/openai/v1/chat/completions';
          if (provider === 'openrouter') ep = 'https://openrouter.ai/api/v1/chat/completions';

          const res = await fetch(ep, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemContext },
                { role: 'user', content: userPrompt }
              ]
            })
          });
          const json = await res.json();
          botResponse = json.choices?.[0]?.message?.content || 'No response generated.';
        }
      } catch (err) {
        botResponse = `⚠️ API connection note: ${err.message}. Providing local response:\n\n` + generateLocalBotReply(userPrompt, active);
      }
    } else {
      botResponse = generateLocalBotReply(userPrompt, active);
    }

    appendChatMessage('bot', botResponse);
  }

  function generateLocalBotReply(prompt, active) {
    const q = prompt.toLowerCase();
    if (!active) {
      return `Please click **💬 Chat** on any table row or analyze a stack trace in Panel A to bind context! Once bound, I can generate code fixes, unit tests, and root cause breakdowns specific to that bug.`;
    }

    if (q.includes('explain') || q.includes('cause')) {
      return `**Root Cause Breakdown for "${active.error_signature}":**\n\n` +
             `${active.root_cause || 'The error occurs when an invalid state transition occurs in ' + active.tech_stack + '.'}\n\n` +
             `In ${active.tech_stack}, this commonly manifests when asynchronous data has not yet resolved or when invariants are violated.`;
    }

    if (q.includes('code') || q.includes('write') || q.includes('fix')) {
      return `**Corrected Code Implementation for ${active.tech_stack}:**\n\n` +
             `Follow these steps:\n${active.fix_requirements}\n\n` +
             `\`\`\`javascript\n// Defensive Implementation\ntry {\n  // Verified Solution for: ${active.error_signature}\n  const result = executeSafely();\n} catch (err) {\n  console.error("Safely handled in TraceVault:", err);\n}\n\`\`\``;
    }

    if (q.includes('test') || q.includes('unit')) {
      return `**Automated Test Case for ${active.tech_stack}:**\n\n` +
             `\`\`\`javascript\ndescribe('${active.tech_stack} Regression Suite', () => {\n  it('should not throw ${active.error_signature}', async () => {\n    const response = await targetHandler();\n    expect(response).toBeDefined();\n  });\n});\n\`\`\``;
    }

    if (q.includes('prevent') || q.includes('checklist')) {
      return `**3-Step Prevention Checklist:**\n\n` +
             `1. **Input Validation:** Enforce boundary checks before invoking operations in ${active.tech_stack}.\n` +
             `2. **Defensive Defaults:** Never leave state uninitialized; use sensible fallbacks.\n` +
             `3. **Automated CI Tests:** Add a regression test to ensure "${active.error_signature}" does not re-occur.`;
    }

    return `For **${active.error_signature}** in **${active.tech_stack}**:\n\n` +
           `Recommended Fix:\n${active.fix_requirements}\n\n` +
           `Root Cause:\n${active.root_cause || 'Cataloged in TraceVault.'}`;
  }

  // =====================================================================
  // TABLE ACTIONS (EDIT, DELETE, HIT, VERIFY, COPY)
  // =====================================================================
  function handleTableClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const id = parseInt(btn.getAttribute('data-id'), 10);
    const mode = btn.getAttribute('data-mode') || 'real';
    const records = mode === 'real' ? state.real.errors : state.demo.errors;
    const record = records.find(r => r.error_id === id);

    if (action === 'hit') {
      incrementHit(id, mode);
    } else if (action === 'chat') {
      if (record) {
        setActiveContext(record);
        appendChatMessage('bot', `Switched active debugging context to **#${record.error_id}: ${record.error_signature}** (${record.tech_stack}). Ask me anything about this error!`);
        el.chatUserInput.focus();
        showToast(`Loaded context: #${record.error_id}`, 'info');
      }
    } else if (action === 'toggle-verify') {
      toggleVerification(id, mode);
    } else if (action === 'copy') {
      if (record) {
        const text = `[TraceVault #${record.error_id}] ${record.error_signature}\nTech: ${record.tech_stack}\nCause: ${record.root_cause}\nFix:\n${record.fix_requirements}`;
        navigator.clipboard.writeText(text);
        showToast(`Copied #${record.error_id} to clipboard`, 'success');
      }
    } else if (action === 'edit') {
      if (record) openEditModal(record, mode);
    } else if (action === 'delete') {
      if (record) openDeleteModal(record, mode);
    }
  }

  async function incrementHit(id, mode) {
    if (state.isStaticMode) {
      const records = getStaticRecords(mode);
      const rec = records.find(r => r.error_id === id);
      if (rec) {
        rec.times_hit = (parseInt(rec.times_hit, 10) || 0) + 1;
        rec.updated_at = new Date().toISOString();
        saveStaticRecords(mode, records);
        const badge = document.getElementById(`hit-badge-${mode}-${id}`);
        if (badge) {
          badge.textContent = rec.times_hit;
          badge.style.transform = 'scale(1.2)';
          setTimeout(() => badge.style.transform = 'scale(1)', 200);
        }
        showToast(`Hit counter incremented! (Total: ${rec.times_hit})`, 'success');
        fetchStats(mode);
      }
      return;
    }

    try {
      const res = await fetch(`/api/errors/${id}/hit?mode=${mode}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        const badge = document.getElementById(`hit-badge-${mode}-${id}`);
        if (badge) {
          badge.textContent = json.times_hit;
          badge.style.transform = 'scale(1.2)';
          setTimeout(() => badge.style.transform = 'scale(1)', 200);
        }
        showToast(`Hit counter incremented! (Total: ${json.times_hit})`, 'success');
        fetchStats(mode);
      }
    } catch (e) {
      showToast('Failed to increment hit', 'error');
    }
  }

  async function toggleVerification(id, mode) {
    if (state.isStaticMode) {
      const records = getStaticRecords(mode);
      const rec = records.find(r => r.error_id === id);
      if (rec) {
        rec.is_verified = rec.is_verified === 1 ? 0 : 1;
        rec.updated_at = new Date().toISOString();
        saveStaticRecords(mode, records);
        showToast(`Verification status updated to: ${rec.is_verified ? 'Verified (✓)' : 'Unverified (⏳)'}`, 'info');
        await fetchErrors(mode);
      }
      return;
    }

    try {
      const res = await fetch(`/api/errors/${id}/verify?mode=${mode}`, { method: 'PATCH' });
      const json = await res.json();
      if (json.success) {
        showToast(`Verification status updated to: ${json.is_verified ? 'Verified (✓)' : 'Unverified (⏳)'}`, 'info');
        await fetchErrors(mode);
      }
    } catch (e) {
      showToast('Toggle failed', 'error');
    }
  }

  // =====================================================================
  // MODALS LOGIC (EDIT & DELETE)
  // =====================================================================
  function openEditModal(record, mode) {
    state.activeEditMode = mode;
    state.editingRecordId = record.error_id;
    el.editErrorId.value = record.error_id;
    el.editErrorMode.value = mode;
    el.editDomainSelect.value = record.domain_id;
    el.editTechInput.value = record.tech_stack;
    el.editSignatureInput.value = record.error_signature;
    el.editCauseInput.value = record.root_cause || '';
    el.editFixTextarea.value = record.fix_requirements;
    el.editVerifiedCheck.checked = record.is_verified === 1 || record.is_verified === true;
    el.modalEditRecord.classList.remove('hidden');
  }

  function closeEditModal() {
    el.modalEditRecord.classList.add('hidden');
    state.editingRecordId = null;
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    const id = state.editingRecordId;
    const mode = state.activeEditMode || 'real';
    if (!id) return;

    const payload = {
      domain_id: parseInt(el.editDomainSelect.value, 10),
      tech_stack: el.editTechInput.value.trim(),
      error_signature: el.editSignatureInput.value.trim(),
      root_cause: el.editCauseInput.value.trim(),
      fix_requirements: el.editFixTextarea.value.trim(),
      is_verified: el.editVerifiedCheck.checked ? 1 : 0,
      mode
    };

    if (state.isStaticMode) {
      const records = getStaticRecords(mode);
      const rec = records.find(r => r.error_id === id);
      if (rec) {
        Object.assign(rec, payload, { updated_at: new Date().toISOString(), source: 'edited' });
        saveStaticRecords(mode, records);
        showToast('Record updated successfully!', 'success');
        closeEditModal();
        await fetchStats(mode);
        await fetchErrors(mode);
      }
      return;
    }

    try {
      const res = await fetch(`/api/errors/${id}?mode=${mode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        showToast('Record updated successfully!', 'success');
        closeEditModal();
        await fetchStats(mode);
        await fetchErrors(mode);
      } else {
        showToast(json.error || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Update error: ' + err.message, 'error');
    }
  }

  function openDeleteModal(record, mode) {
    state.activeDeleteMode = mode;
    state.deletingRecordId = record.error_id;
    el.deletePreviewId.textContent = `Record ID: #${record.error_id} (${record.tech_stack}) [${mode.toUpperCase()} VAULT]`;
    el.deletePreviewSignature.textContent = record.error_signature;
    el.modalDeleteConfirm.classList.remove('hidden');
  }

  function closeDeleteModal() {
    el.modalDeleteConfirm.classList.add('hidden');
    state.deletingRecordId = null;
  }

  async function handleDeleteConfirm() {
    const id = state.deletingRecordId;
    const mode = state.activeDeleteMode || 'real';
    if (!id) return;

    if (state.isStaticMode) {
      let records = getStaticRecords(mode);
      records = records.filter(r => r.error_id !== id);
      saveStaticRecords(mode, records);
      showToast(`Record #${id} permanently deleted.`, 'success');
      closeDeleteModal();
      if (mode === 'real' && state.activeError?.error_id === id) {
        detachContext();
      }
      await fetchStats(mode);
      await fetchErrors(mode);
      return;
    }

    try {
      const res = await fetch(`/api/errors/${id}?mode=${mode}`, { method: 'DELETE' });
      const json = await res.json();

      if (json.success) {
        showToast(`Record #${id} permanently deleted.`, 'success');
        closeDeleteModal();
        if (mode === 'real' && state.activeError?.error_id === id) {
          detachContext();
        }
        await fetchStats(mode);
        await fetchErrors(mode);
      } else {
        showToast(json.error || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Delete error: ' + err.message, 'error');
    }
  }

  // =====================================================================
  // LAB DEMO SANDBOX MODAL (Alt + L)
  // =====================================================================
  function toggleLabModal() {
    const isHidden = el.modalLabSandbox.classList.contains('hidden');
    if (isHidden) {
      openLabModal();
    } else {
      closeLabModal();
    }
  }

  function openLabModal() {
    el.modalLabSandbox.classList.remove('hidden');
    fetchStats('demo');
    fetchErrors('demo');
    showToast('Opened Live Demo Workspace', 'info');
  }

  function closeLabModal() {
    el.modalLabSandbox.classList.add('hidden');
  }

  // =====================================================================
  // BYOK SETTINGS MODAL & TEST KEY
  // =====================================================================
  function initByokStatus() {
    const key = localStorage.getItem('tv_ai_key');
    const labelEl = el.byokBtnLabel || document.getElementById('byok-btn-label');
    if (key && key.trim() !== '') {
      if (labelEl) labelEl.textContent = 'AI Connected';
      if (el.byokStatusPill) {
        el.byokStatusPill.textContent = 'Connected';
        el.byokStatusPill.className = 'byok-indicator active';
      }
    } else {
      if (labelEl) labelEl.textContent = 'AI Key';
      if (el.byokStatusPill) {
        el.byokStatusPill.textContent = 'Offline';
        el.byokStatusPill.className = 'byok-indicator';
      }
    }
  }

  function openByokModal() {
    const key = localStorage.getItem('tv_ai_key') || '';
    if (el.byokKeyInput) el.byokKeyInput.value = key;
    if (el.testKeyResult) el.testKeyResult.textContent = '';
    handleKeyInput();
    el.modalByokConfig.classList.remove('hidden');
  }

  function closeByokModal() {
    el.modalByokConfig.classList.add('hidden');
  }

  function toggleKeyVisibility() {
    const isPass = el.byokKeyInput.type === 'password';
    el.byokKeyInput.type = isPass ? 'text' : 'password';
    el.btnToggleKeyVisibility.textContent = isPass ? '🙈' : '👁️';
  }

  function saveByokSettings() {
    const key = el.byokKeyInput.value.trim();
    if (!key) {
      clearByokSettings();
      closeByokModal();
      return;
    }

    const detected = detectProviderFromKey(key);
    const prov = detected ? detected.provider : (localStorage.getItem('tv_ai_provider') || 'gemini');
    const mod = detected ? detected.model : (localStorage.getItem('tv_ai_model') || PROVIDER_DEFAULTS[prov] || 'gemini-2.5-flash');

    localStorage.setItem('tv_ai_provider', prov);
    localStorage.setItem('tv_ai_model', mod);
    localStorage.setItem('tv_ai_key', key);

    initByokStatus();
    closeByokModal();
    showToast('AI Key connected successfully!', 'success');
  }

  function clearByokSettings() {
    localStorage.removeItem('tv_ai_key');
    if (el.byokKeyInput) el.byokKeyInput.value = '';
    handleKeyInput();
    initByokStatus();
    if (el.testKeyResult) {
      el.testKeyResult.textContent = 'Disconnected. Key removed.';
      el.testKeyResult.style.color = 'var(--text-muted)';
    }
    closeByokModal();
    showToast('AI Key disconnected. Running offline heuristic analyzer.', 'info');
  }

  async function probeProvider(provider, model, key) {
    if (provider === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Say OK' }] }] })
      });
      if (res.ok) return true;
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    let ep = 'https://api.openai.com/v1/chat/completions';
    if (provider === 'groq') ep = 'https://api.groq.com/openai/v1/chat/completions';
    if (provider === 'openrouter') ep = 'https://openrouter.ai/api/v1/chat/completions';

    const res = await fetch(ep, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: model, messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 5 })
    });
    if (res.ok) return true;
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  async function testAiKey() {
    const key = el.byokKeyInput.value.trim();
    if (!key) {
      el.testKeyResult.textContent = '❌ Please enter an API key first.';
      el.testKeyResult.style.color = 'var(--accent-rose)';
      return;
    }

    el.testKeyResult.textContent = '⏳ Testing connection with universal router...';
    el.testKeyResult.style.color = 'var(--accent-cyan)';

    const detected = detectProviderFromKey(key);
    const candidates = [];
    if (detected) {
      candidates.push({ provider: detected.provider, model: detected.model, label: detected.label });
      if (detected.fallback) candidates.push({ provider: detected.provider, model: detected.fallback, label: detected.label });
    }
    const defaultCandidates = [
      { provider: 'gemini', model: 'gemini-2.5-flash', label: 'Google Gemini' },
      { provider: 'gemini', model: 'gemini-1.5-flash', label: 'Google Gemini 1.5' },
      { provider: 'groq', model: 'llama-3.3-70b-versatile', label: 'Groq' },
      { provider: 'openrouter', model: 'deepseek/deepseek-r1:free', label: 'OpenRouter' },
      { provider: 'openai', model: 'gpt-4o-mini', label: 'OpenAI' }
    ];
    for (const c of defaultCandidates) {
      if (!candidates.some(x => x.provider === c.provider && x.model === c.model)) {
        candidates.push(c);
      }
    }

    let verified = null;
    let lastError = null;
    for (const candidate of candidates) {
      try {
        await probeProvider(candidate.provider, candidate.model, key);
        verified = candidate;
        break;
      } catch (e) {
        lastError = e;
      }
    }

    if (verified) {
      el.testKeyResult.textContent = `✅ Connected to ${verified.label}!`;
      el.testKeyResult.style.color = 'var(--accent-emerald)';
      localStorage.setItem('tv_ai_provider', verified.provider);
      localStorage.setItem('tv_ai_model', verified.model);
      localStorage.setItem('tv_ai_key', key);
      initByokStatus();
    } else {
      el.testKeyResult.textContent = `❌ Verification failed: ${lastError?.message || 'Invalid key'}`;
      el.testKeyResult.style.color = 'var(--accent-rose)';
    }
  }

  // =====================================================================
  // MYSQL 3306 LIVE INSPECTOR & REAL-TIME SQL PING
  // =====================================================================
  async function openMysqlModal() {
    if (el.modalMysqlSync) {
      el.modalMysqlSync.classList.remove('hidden');
      await runLiveSqlPing();
    }
  }

  function closeMysqlModal() {
    if (el.modalMysqlSync) {
      el.modalMysqlSync.classList.add('hidden');
    }
  }

  async function runLiveSqlPing() {
    if (!el.btnRunSqlPing || !el.sqlPingResult) return;
    el.btnRunSqlPing.disabled = true;
    el.btnRunSqlPing.textContent = '⏳ Pinging MySQL...';
    if (el.sqlPingLatency) el.sqlPingLatency.textContent = '... ms';

    const t0 = performance.now();
    try {
      const res = await fetch('/api/mysql/ping');
      const data = await res.json();
      const elapsed = Math.round(performance.now() - t0);
      const latency = data.latency_ms ?? elapsed;

      if (el.sqlPingLatency) {
        el.sqlPingLatency.textContent = `${latency} ms`;
        el.sqlPingLatency.className = latency < 50 ? 'badge badge-primary' : 'badge badge-accent';
      }

      if (data.success) {
        el.sqlPingResult.textContent = JSON.stringify(data.result, null, 2);
        el.sqlPingResult.style.color = '#a7f3d0';
        if (el.modalDbStatusBadge) {
          el.modalDbStatusBadge.textContent = '● MySQL 3306 Live';
          el.modalDbStatusBadge.className = 'badge badge-primary';
        }
        if (data.metadata) {
          if (el.inspectHost) el.inspectHost.textContent = data.metadata.host;
          if (el.inspectDb) el.inspectDb.textContent = data.metadata.database;
          if (el.inspectDriver) el.inspectDriver.textContent = data.metadata.driver;
          if (el.inspectNorm) el.inspectNorm.textContent = data.metadata.normalization;
        }
      } else {
        el.sqlPingResult.textContent = `Error: ${data.error || 'Connection failed'}`;
        el.sqlPingResult.style.color = 'var(--accent-rose)';
        if (el.modalDbStatusBadge) {
          el.modalDbStatusBadge.textContent = '○ Offline';
          el.modalDbStatusBadge.className = 'badge badge-subtle';
        }
      }
    } catch (err) {
      const elapsed = Math.round(performance.now() - t0);
      if (el.sqlPingLatency) el.sqlPingLatency.textContent = `${elapsed} ms`;
      el.sqlPingResult.textContent = `Connection error: ${err.message}`;
      el.sqlPingResult.style.color = 'var(--accent-rose)';
    } finally {
      el.btnRunSqlPing.disabled = false;
      el.btnRunSqlPing.textContent = '⚡ Run Live SQL Ping';
    }
  }

  // =====================================================================
  // EXPORT VAULT (JSON & CSV)
  // =====================================================================
  function exportVault(format) {
    el.exportMenu.classList.remove('open');
    if (state.isStaticMode) {
      const records = getStaticRecords('real');
      let dataUri = '';
      if (format === 'csv') {
        const header = ['ID', 'Domain ID', 'Tech Stack', 'Error Signature', 'Root Cause', 'Fix Requirements', 'Source', 'Hits', 'Verified', 'Created At'];
        const rows = records.map(r => [
          r.error_id,
          r.domain_id,
          `"${(r.tech_stack || '').replace(/"/g, '""')}"`,
          `"${(r.error_signature || '').replace(/"/g, '""')}"`,
          `"${(r.root_cause || '').replace(/"/g, '""')}"`,
          `"${(r.fix_requirements || '').replace(/"/g, '""')}"`,
          r.source,
          r.times_hit,
          r.is_verified,
          r.created_at
        ].join(','));
        const csvContent = [header.join(','), ...rows].join('\n');
        dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      } else {
        dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
      }
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = `tracevault-real-vault-${Date.now()}.${format}`;
      a.click();
      showToast(`Exported ${records.length} records (${format.toUpperCase()})`, 'info');
      return;
    }

    window.location.href = `/api/export?format=${format}&mode=real`;
    showToast(`Downloading Real Vault backup (${format.toUpperCase()})...`, 'info');
  }

  // =====================================================================
  // EVENT LISTENERS BINDING
  // =====================================================================
  function attachEventListeners() {
    // Theme toggle
    el.themeToggleBtn.addEventListener('click', toggleTheme);

    // Export dropdown toggle
    el.exportDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      el.exportMenu.parentElement.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      el.exportMenu?.parentElement.classList.remove('open');
    });
    el.exportJsonBtn.addEventListener('click', () => exportVault('json'));
    el.exportCsvBtn.addEventListener('click', () => exportVault('csv'));

    // MySQL Status / Setup Info Modal Trigger
    if (el.mysqlStatusTrigger) {
      el.mysqlStatusTrigger.addEventListener('click', openMysqlModal);
    }
    if (el.btnCloseMysqlModal) {
      el.btnCloseMysqlModal.addEventListener('click', closeMysqlModal);
    }
    if (el.btnCloseMysqlFooter) {
      el.btnCloseMysqlFooter.addEventListener('click', closeMysqlModal);
    }
    if (el.btnRunSqlPing) {
      el.btnRunSqlPing.addEventListener('click', runLiveSqlPing);
    }

    // BYOK Modal
    el.openByokModalBtn.addEventListener('click', openByokModal);
    el.btnCloseByokModal.addEventListener('click', closeByokModal);
    if (el.byokKeyInput) {
      el.byokKeyInput.addEventListener('input', handleKeyInput);
      el.byokKeyInput.addEventListener('paste', () => setTimeout(handleKeyInput, 50));
    }
    if (el.btnToggleKeyVisibility) el.btnToggleKeyVisibility.addEventListener('click', toggleKeyVisibility);
    if (el.btnSaveByok) el.btnSaveByok.addEventListener('click', saveByokSettings);
    if (el.btnClearByok) el.btnClearByok.addEventListener('click', clearByokSettings);
    if (el.btnTestAiKey) el.btnTestAiKey.addEventListener('click', testAiKey);

    // Keyboard Shortcuts: Ctrl+K / Cmd+K (Search) & Alt+L (Lab Sandbox)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        el.globalSearchInput.focus();
        el.globalSearchInput.select();
      }
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        toggleLabModal();
      }
      if (e.key === 'Escape') {
        closeEditModal();
        closeDeleteModal();
        closeByokModal();
        closeLabModal();
        closeMysqlModal();
      }
    });

    // Real Search Input
    el.globalSearchInput.addEventListener('input', (e) => {
      clearTimeout(state.searchDebounceTimer);
      state.searchDebounceTimer = setTimeout(() => {
        state.real.filters.search = e.target.value;
        el.filterSearch.value = e.target.value;
        fetchErrors('real');
      }, 250);
    });

    // Workspace Tabs
    el.btnTabScanner.addEventListener('click', () => {
      el.btnTabScanner.classList.add('active');
      el.btnTabManual.classList.remove('active');
      el.tabScanner.classList.add('active');
      el.tabManual.classList.remove('active');
    });

    el.btnTabManual.addEventListener('click', () => {
      el.btnTabManual.classList.add('active');
      el.btnTabScanner.classList.remove('active');
      el.tabManual.classList.add('active');
      el.tabScanner.classList.remove('active');
    });

    // Quick Test Presets
    el.sampleErrorSelect.addEventListener('change', (e) => {
      const presetKey = e.target.value;
      if (presetKey && SAMPLE_PRESETS[presetKey]) {
        const item = SAMPLE_PRESETS[presetKey];
        el.scanDomainSelect.value = item.domain_id;
        el.scanTechInput.value = item.tech;
        el.scanTraceTextarea.value = item.trace;
        showToast(`Loaded sample: ${item.tech}`, 'info');
      }
    });

    // Scanner Form
    el.aiScannerForm.addEventListener('submit', handleAiScan);
    el.btnClearScan.addEventListener('click', () => {
      el.aiScannerForm.reset();
      el.scannerResultBox.classList.add('hidden');
    });

    // Manual Entry Form
    el.manualEntryForm.addEventListener('submit', handleManualEntry);

    // Chat Box
    el.chatInputForm.addEventListener('submit', handleChatSubmit);
    el.btnDetachContext.addEventListener('click', detachContext);
    el.btnClearChat.addEventListener('click', () => {
      el.chatMessages.innerHTML = `
        <div class="chat-message bot-message">
          <div class="message-avatar">
            <img src="app-icon.svg?v=cube_v6" class="bot-avatar-img" alt="TraceVault AI" style="width: 22px; height: 22px; display: block;" />
          </div>
          <div class="message-content">
            <p>Session chat cleared. Select an error row or scan broken code to debug!</p>
          </div>
        </div>
      `;
    });

    // Prompt Chips
    document.querySelectorAll('.prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const promptText = chip.getAttribute('data-prompt');
        el.chatUserInput.value = promptText;
        el.chatInputForm.dispatchEvent(new Event('submit'));
      });
    });

    // Real Table Filters
    el.filterSearch.addEventListener('input', (e) => {
      clearTimeout(state.searchDebounceTimer);
      state.searchDebounceTimer = setTimeout(() => {
        state.real.filters.search = e.target.value;
        el.globalSearchInput.value = e.target.value;
        fetchErrors('real');
      }, 250);
    });

    el.filterDomain.addEventListener('change', (e) => {
      state.real.filters.domain_id = e.target.value;
      fetchErrors('real');
      fetchStats('real');
    });

    el.filterTech.addEventListener('input', (e) => {
      clearTimeout(state.searchDebounceTimer);
      state.searchDebounceTimer = setTimeout(() => {
        state.real.filters.tech_stack = e.target.value;
        fetchErrors('real');
      }, 250);
    });

    el.filterVerified.addEventListener('change', (e) => {
      state.real.filters.verified = e.target.value;
      fetchErrors('real');
    });

    el.filterSort.addEventListener('change', (e) => {
      state.real.filters.sort = e.target.value;
      fetchErrors('real');
    });

    el.btnResetFilters.addEventListener('click', () => {
      state.real.filters = { search: '', domain_id: 'all', tech_stack: '', verified: 'all', sort: 'hits' };
      el.globalSearchInput.value = '';
      el.filterSearch.value = '';
      el.filterDomain.value = 'all';
      el.filterTech.value = '';
      el.filterVerified.value = 'all';
      el.filterSort.value = 'hits';
      fetchErrors('real');
      fetchStats('real');
      showToast('Filters reset to default', 'info');
    });

    // Real Table Click Handler
    el.vaultTableBody.addEventListener('click', handleTableClick);

    // Lab Demo Sandbox Trigger & Controls
    el.openLabModalBtn.addEventListener('click', openLabModal);
    el.btnCloseLabModal.addEventListener('click', closeLabModal);
    el.btnCloseLabFooter.addEventListener('click', closeLabModal);
    el.btnLabReset.addEventListener('click', resetLabDemoRecords);
    el.labQuickAddForm.addEventListener('submit', handleLabQuickAdd);

    // Lab Table Click Handler
    el.labTableBody.addEventListener('click', handleTableClick);

    // Lab Filter Controls
    el.labFilterSearch.addEventListener('input', (e) => {
      clearTimeout(state.labSearchDebounceTimer);
      state.labSearchDebounceTimer = setTimeout(() => {
        state.demo.filters.search = e.target.value;
        fetchErrors('demo');
      }, 250);
    });

    el.labFilterDomain.addEventListener('change', (e) => {
      state.demo.filters.domain_id = e.target.value;
      fetchErrors('demo');
      fetchStats('demo');
    });

    el.labFilterSort.addEventListener('change', (e) => {
      state.demo.filters.sort = e.target.value;
      fetchErrors('demo');
    });

    el.btnLabResetFilters.addEventListener('click', () => {
      state.demo.filters = { search: '', domain_id: 'all', sort: 'hits' };
      el.labFilterSearch.value = '';
      el.labFilterDomain.value = 'all';
      el.labFilterSort.value = 'hits';
      fetchErrors('demo');
      fetchStats('demo');
    });

    // Edit Modal Actions
    el.btnCloseEditModal.addEventListener('click', closeEditModal);
    el.btnCancelEdit.addEventListener('click', closeEditModal);
    el.editRecordForm.addEventListener('submit', handleEditSubmit);

    // Delete Modal Actions
    el.btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
    el.btnCancelDelete.addEventListener('click', closeDeleteModal);
    el.btnConfirmDelete.addEventListener('click', handleDeleteConfirm);
  }

  // Run on page load
  document.addEventListener('DOMContentLoaded', init);

})();
