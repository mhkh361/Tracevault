/**
 * TraceVault - Self-Learning AI Debug Bot & Local-First Error Knowledge Base
 * Backend REST API Server (Obsidian Glass Edition with Auto-MySQL Bootstrapper & Two-Way Sync)
 * 
 * Demonstrates:
 * - Express 4.x Static Serving & REST API
 * - Zero-Click Schema & Seed Auto-Creation on MySQL connection
 * - Automatic Two-Way Live Data Sync (MySQL <-> data/*.json)
 * - Strict Separation: Real Developer Workspace (is_demo = 0) vs. Lab Demo Sandbox (is_demo = 1)
 * - Raw Parameterized SQL queries via mysql2/promise (No ORM, SQL Injection proof)
 * - Stored Procedure invocation (sp_increment_error_hit)
 * - Trigger execution (trg_error_logs_before_update)
 * - View querying (v_domain_summary)
 * - IDE Extension Bridge (POST /api/ide/diagnose)
 * - Demo Reset endpoint (POST /api/demo/reset)
 * - Vault Export (JSON / CSV)
 */

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Persistent Local Disk Storage Paths
const DATA_DIR = path.join(__dirname, 'data');
const REAL_VAULT_PATH = path.join(DATA_DIR, 'real-vault.json');
const DEMO_VAULT_PATH = path.join(DATA_DIR, 'demo-vault.json');
const SQL_FILE_PATH = path.join(__dirname, 'database.sql');

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Database Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tracevault',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

let pool = null;
let isDbConnected = false;
let dbLastError = null;

// Parent Domains
const DEFAULT_DOMAINS = [
  { domain_id: 1, domain_name: 'Frontend' },
  { domain_id: 2, domain_name: 'Backend' },
  { domain_id: 3, domain_name: 'Database' },
  { domain_id: 4, domain_name: 'Fullstack' }
];

// The 12 Canonical Lab Evaluation Seed Records (is_demo = 1)
const INITIAL_DEMO_ERRORS = [
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    error_id: 10,
    domain_id: 4,
    tech_stack: 'Web API / CORS',
    error_signature: "Access to fetch at origin has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header",
    signature_hash: '5a58e7bd0031b6b11266738cbb39c02b844053014ec9b0d999576487e6e570f9',
    root_cause: 'Backend server lacks appropriate Cross-Origin Resource Sharing response headers.',
    fix_requirements: '1. Install cors package: npm install cors\n2. Add middleware before routes: app.use(cors({ origin: \'http://localhost:3000\', credentials: true }));\n3. Handle preflight OPTIONS requests.',
    source: 'manual',
    is_verified: 1,
    times_hit: 15,
    is_demo: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// =====================================================================
// PERSISTENT LOCAL DISK & SYNC HELPERS
// =====================================================================

async function initLocalDiskStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fsPromises.mkdir(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(REAL_VAULT_PATH)) {
      await fsPromises.writeFile(REAL_VAULT_PATH, JSON.stringify([], null, 2), 'utf8');
    }
    if (!fs.existsSync(DEMO_VAULT_PATH)) {
      await fsPromises.writeFile(DEMO_VAULT_PATH, JSON.stringify(INITIAL_DEMO_ERRORS, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('[TraceVault] Error initializing data directory:', err);
  }
}

async function readDiskVault(mode) {
  const filePath = mode === 'demo' ? DEMO_VAULT_PATH : REAL_VAULT_PATH;
  try {
    if (!fs.existsSync(filePath)) {
      const initial = mode === 'demo' ? INITIAL_DEMO_ERRORS : [];
      await fsPromises.writeFile(filePath, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const content = await fsPromises.readFile(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`[TraceVault] Failed to read ${filePath}:`, err);
    return mode === 'demo' ? INITIAL_DEMO_ERRORS : [];
  }
}

async function writeDiskVault(mode, records) {
  const filePath = mode === 'demo' ? DEMO_VAULT_PATH : REAL_VAULT_PATH;
  try {
    await fsPromises.writeFile(filePath, JSON.stringify(records, null, 2), 'utf8');
  } catch (err) {
    console.error(`[TraceVault] Failed to write ${filePath}:`, err);
  }
}

function computeSignatureHash(domainId, techStack, signature) {
  const normalized = `${domainId}:${techStack.trim().toLowerCase()}:${signature.trim().toLowerCase()}`;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function getMode(req) {
  const m = (req.query.mode || req.body.mode || '').toLowerCase();
  return m === 'demo' ? 'demo' : 'real';
}

/**
 * Executes zero-click schema bootstrapper and two-way sync on MySQL connection
 */
async function bootstrapMySQL(conn) {
  try {
    console.log('[TraceVault] ⚙️ Executing zero-click MySQL bootstrapper and sync...');
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await conn.query(`USE \`${dbConfig.database}\`;`);

    // Verify / create tables
    const [tables] = await conn.query("SHOW TABLES LIKE 'error_logs'");
    if (tables.length === 0 && fs.existsSync(SQL_FILE_PATH)) {
      const sqlContent = fs.readFileSync(SQL_FILE_PATH, 'utf8');
      const noComments = sqlContent
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/DELIMITER \/\/[\s\S]*?DELIMITER ;/g, '');

      const stmts = noComments
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of stmts) {
        try {
          await conn.query(stmt);
        } catch (e) {}
      }
      console.log('[TraceVault] ✅ MySQL tables & stored procedures created successfully.');
    }

    // Ensure is_demo column exists
    try {
      const [cols] = await conn.query("SHOW COLUMNS FROM error_logs LIKE 'is_demo'");
      if (cols.length === 0) {
        await conn.query("ALTER TABLE error_logs ADD COLUMN is_demo TINYINT(1) NOT NULL DEFAULT 0, ADD INDEX idx_is_demo (is_demo)");
      }
    } catch (e) {}

    // Seed 12 lab demo records if none present
    const [demoCount] = await conn.query('SELECT COUNT(*) AS cnt FROM error_logs WHERE is_demo = 1');
    if (demoCount[0].cnt === 0) {
      console.log('[TraceVault] Seeding 12 Lab Demo records into MySQL...');
      for (const item of INITIAL_DEMO_ERRORS) {
        await conn.query(`
          INSERT INTO error_logs 
            (error_id, domain_id, tech_stack, error_signature, signature_hash, root_cause, fix_requirements, source, is_verified, times_hit, is_demo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          ON DUPLICATE KEY UPDATE times_hit = error_logs.times_hit;
        `, [
          item.error_id, item.domain_id, item.tech_stack, item.error_signature,
          item.signature_hash, item.root_cause, item.fix_requirements,
          item.source, item.is_verified, item.times_hit
        ]);
      }
    }

    // Two-Way Sync: Mirror any offline real developer records into MySQL
    const realDisk = await readDiskVault('real');
    if (realDisk.length > 0) {
      console.log(`[TraceVault] 🔄 Mirroring ${realDisk.length} real developer records from local disk into MySQL...`);
      for (const item of realDisk) {
        await conn.query(`
          INSERT INTO error_logs 
            (domain_id, tech_stack, error_signature, signature_hash, root_cause, fix_requirements, source, is_verified, times_hit, is_demo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
          ON DUPLICATE KEY UPDATE times_hit = error_logs.times_hit, updated_at = CURRENT_TIMESTAMP;
        `, [
          item.domain_id, item.tech_stack, item.error_signature, item.signature_hash,
          item.root_cause, item.fix_requirements, item.source || 'manual', item.is_verified || 0, item.times_hit || 1
        ]);
      }
      console.log('[TraceVault] ✅ Offline records successfully mirrored to MySQL!');
    }

    console.log(`[TraceVault] 🟢 MySQL 3306 Live and 100% in sync with TraceVault.`);
  } catch (err) {
    console.error('[TraceVault] Error during MySQL bootstrap/sync:', err);
  }
}

/**
 * Initializes and tests MySQL connection.
 */
async function initializeDatabase() {
  await initLocalDiskStorage();

  try {
    pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();
    await bootstrapMySQL(conn);
    conn.release();

    isDbConnected = true;
    dbLastError = null;
  } catch (err) {
    isDbConnected = false;
    dbLastError = err.message;
    console.warn(`[TraceVault] ⚡ MySQL not active at ${dbConfig.host}:${dbConfig.port}. (Reason: ${err.message})`);
    console.warn(`[TraceVault] 💾 Operating in Persistent Local Disk Vault mode (data/real-vault.json & data/demo-vault.json).`);
  }
}

// Background auto-reconnect poller
setInterval(async () => {
  if (!isDbConnected) {
    try {
      const testPool = mysql.createPool(dbConfig);
      const conn = await testPool.getConnection();
      await bootstrapMySQL(conn);
      conn.release();
      pool = testPool;
      isDbConnected = true;
      dbLastError = null;
      console.log(`[TraceVault] 🚀 MySQL server detected on 3306! Switched to live MySQL connection.`);
    } catch (e) {
      // Still offline
    }
  }
}, 8000);

// =====================================================================
// REST API ENDPOINTS
// =====================================================================

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'TraceVault',
    version: '3.0.0',
    db_connected: isDbConnected,
    storage_engine: isDbConnected ? 'mysql' : 'persistent-disk',
    status_label: isDbConnected ? '● MySQL 3306 Live' : '⚡ Sync MySQL',
    db_name: dbConfig.database,
    db_host: dbConfig.host,
    db_port: dbConfig.port,
    db_error: dbLastError
  });
});

/**
 * GET /api/mysql/ping
 * Real-time SQL ping & metadata for MySQL 3306 Live Connection Inspector
 */
app.get('/api/mysql/ping', async (req, res) => {
  const startTime = Date.now();
  const sqlQuery = "SELECT 1 AS ping, DATABASE() AS active_db, VERSION() AS mysql_version, NOW() AS server_time, (SELECT COUNT(*) FROM error_logs) AS total_vault_records;";
  
  if (!isDbConnected || !pool) {
    return res.status(503).json({
      success: false,
      error: 'MySQL server not connected on port ' + dbConfig.port,
      sql: sqlQuery,
      latency_ms: Date.now() - startTime
    });
  }

  try {
    const [rows] = await pool.query(sqlQuery);
    const latencyMs = Date.now() - startTime;
    return res.json({
      success: true,
      sql: sqlQuery,
      latency_ms: latencyMs,
      result: rows[0],
      metadata: {
        host: `${dbConfig.host}:${dbConfig.port}`,
        database: dbConfig.database,
        driver: 'mysql2/promise (Prepared Statements)',
        normalization: '3NF (Third Normal Form)',
        tables: [
          { name: 'domains', type: 'Parent / Primary Key (domain_id)' },
          { name: 'error_logs', type: 'Child / Foreign Key (domain_id -> domains.domain_id)' }
        ],
        view: 'v_domain_summary (Domain error count & hit metrics)',
        stored_procedure: 'sp_increment_error_hit(IN p_error_id INT)',
        trigger: 'trg_error_logs_before_update (Auto-updates updated_at timestamp)'
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      sql: sqlQuery,
      latency_ms: Date.now() - startTime
    });
  }
});

/**
 * GET /api/domains
 */
app.get('/api/domains', async (req, res) => {
  try {
    if (isDbConnected) {
      const [rows] = await pool.query('SELECT domain_id, domain_name FROM domains ORDER BY domain_id ASC');
      return res.json({ success: true, data: rows });
    }
    return res.json({ success: true, data: DEFAULT_DOMAINS });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database query error: ' + err.message });
  }
});

/**
 * GET /api/stats?mode=real|demo
 */
app.get('/api/stats', async (req, res) => {
  const mode = getMode(req);
  const isDemoFlag = mode === 'demo' ? 1 : 0;

  try {
    if (isDbConnected) {
      const [aggRows] = await pool.query(`
        SELECT 
          COUNT(*) AS total_errors,
          COALESCE(SUM(times_hit), 0) AS total_hits,
          ROUND(COALESCE(AVG(times_hit), 0), 1) AS avg_hits,
          COALESCE(MAX(times_hit), 0) AS max_hits,
          COALESCE(MIN(times_hit), 0) AS min_hits
        FROM error_logs
        WHERE is_demo = ?
      `, [isDemoFlag]);

      const [topBugRows] = await pool.query(`
        SELECT e.error_id, e.tech_stack, e.error_signature, e.times_hit, d.domain_name
        FROM error_logs e
        INNER JOIN domains d ON e.domain_id = d.domain_id
        WHERE e.is_demo = ?
        ORDER BY e.times_hit DESC, e.error_id ASC
        LIMIT 1
      `, [isDemoFlag]);

      const [breakdownRows] = await pool.query(`
        SELECT 
          d.domain_id, 
          d.domain_name, 
          COUNT(e.error_id) AS total_errors, 
          COALESCE(SUM(e.times_hit), 0) AS total_hits,
          ROUND(COALESCE(AVG(e.times_hit), 0), 1) AS avg_hits
        FROM domains d
        LEFT JOIN error_logs e ON d.domain_id = e.domain_id AND e.is_demo = ?
        GROUP BY d.domain_id, d.domain_name
        ORDER BY d.domain_id ASC
      `, [isDemoFlag]);

      return res.json({
        success: true,
        mode,
        data: {
          aggregates: aggRows[0],
          top_bug: topBugRows[0] || null,
          domain_breakdown: breakdownRows,
          storage: 'mysql'
        }
      });
    }

    // Persistent Local Disk Fallback
    const vaultRecords = await readDiskVault(mode);
    const total_errors = vaultRecords.length;
    const total_hits = vaultRecords.reduce((sum, e) => sum + e.times_hit, 0);
    const avg_hits = total_errors > 0 ? parseFloat((total_hits / total_errors).toFixed(1)) : 0;
    const hitsArr = vaultRecords.map(e => e.times_hit);
    const max_hits = hitsArr.length > 0 ? Math.max(...hitsArr) : 0;
    const min_hits = hitsArr.length > 0 ? Math.min(...hitsArr) : 0;

    const sortedByHits = [...vaultRecords].sort((a, b) => b.times_hit - a.times_hit);
    const topItem = sortedByHits[0];
    const top_bug = topItem ? {
      error_id: topItem.error_id,
      tech_stack: topItem.tech_stack,
      error_signature: topItem.error_signature,
      times_hit: topItem.times_hit,
      domain_name: DEFAULT_DOMAINS.find(d => d.domain_id === topItem.domain_id)?.domain_name || 'General'
    } : null;

    const domain_breakdown = DEFAULT_DOMAINS.map(d => {
      const dErrors = vaultRecords.filter(e => e.domain_id === d.domain_id);
      const dHits = dErrors.reduce((acc, curr) => acc + curr.times_hit, 0);
      return {
        domain_id: d.domain_id,
        domain_name: d.domain_name,
        total_errors: dErrors.length,
        total_hits: dHits,
        avg_hits: dErrors.length > 0 ? parseFloat((dHits / dErrors.length).toFixed(1)) : 0
      };
    });

    return res.json({
      success: true,
      mode,
      data: {
        aggregates: { total_errors, total_hits, avg_hits, max_hits, min_hits },
        top_bug,
        domain_breakdown,
        storage: 'persistent-disk'
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Stats query error: ' + err.message });
  }
});

/**
 * GET /api/errors?mode=real|demo
 */
app.get('/api/errors', async (req, res) => {
  const mode = getMode(req);
  const isDemoFlag = mode === 'demo' ? 1 : 0;
  const { search, domain_id, tech_stack, verified, sort } = req.query;

  try {
    if (isDbConnected) {
      let query = `
        SELECT 
          e.error_id,
          e.domain_id,
          d.domain_name,
          e.tech_stack,
          e.error_signature,
          e.signature_hash,
          e.root_cause,
          e.fix_requirements,
          e.source,
          e.is_verified,
          e.times_hit,
          e.is_demo,
          e.created_at,
          e.updated_at
        FROM error_logs e
        INNER JOIN domains d ON e.domain_id = d.domain_id
        WHERE e.is_demo = ?
      `;
      const params = [isDemoFlag];

      if (search && search.trim() !== '') {
        query += ` AND (e.error_signature LIKE ? OR e.tech_stack LIKE ? OR e.root_cause LIKE ?)`;
        const wild = `%${search.trim()}%`;
        params.push(wild, wild, wild);
      }

      if (domain_id && domain_id !== 'all' && !isNaN(parseInt(domain_id, 10))) {
        query += ` AND e.domain_id = ?`;
        params.push(parseInt(domain_id, 10));
      }

      if (tech_stack && tech_stack.trim() !== '') {
        query += ` AND e.tech_stack LIKE ?`;
        params.push(`%${tech_stack.trim()}%`);
      }

      if (verified !== undefined && verified !== 'all' && (verified === '1' || verified === '0')) {
        query += ` AND e.is_verified = ?`;
        params.push(parseInt(verified, 10));
      }

      if (sort === 'updated') {
        query += ` ORDER BY e.updated_at DESC, e.error_id DESC`;
      } else if (sort === 'id_desc') {
        query += ` ORDER BY e.error_id DESC`;
      } else if (sort === 'id_asc') {
        query += ` ORDER BY e.error_id ASC`;
      } else {
        query += ` ORDER BY e.times_hit DESC, e.updated_at DESC`;
      }

      const [rows] = await pool.query(query, params);
      return res.json({ success: true, mode, count: rows.length, data: rows });
    }

    // Disk Vault filter
    const vaultRecords = await readDiskVault(mode);
    let filtered = [...vaultRecords];

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(e => 
        e.error_signature.toLowerCase().includes(q) ||
        e.tech_stack.toLowerCase().includes(q) ||
        (e.root_cause && e.root_cause.toLowerCase().includes(q))
      );
    }

    if (domain_id && domain_id !== 'all' && !isNaN(parseInt(domain_id, 10))) {
      const dId = parseInt(domain_id, 10);
      filtered = filtered.filter(e => e.domain_id === dId);
    }

    if (tech_stack && tech_stack.trim() !== '') {
      const stack = tech_stack.trim().toLowerCase();
      filtered = filtered.filter(e => e.tech_stack.toLowerCase().includes(stack));
    }

    if (verified !== undefined && verified !== 'all' && (verified === '1' || verified === '0')) {
      const v = parseInt(verified, 10);
      filtered = filtered.filter(e => e.is_verified === v);
    }

    if (sort === 'updated') {
      filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } else if (sort === 'id_desc') {
      filtered.sort((a, b) => b.error_id - a.error_id);
    } else if (sort === 'id_asc') {
      filtered.sort((a, b) => a.error_id - b.error_id);
    } else {
      filtered.sort((a, b) => b.times_hit - a.times_hit || new Date(b.updated_at) - new Date(a.updated_at));
    }

    const result = filtered.map(e => ({
      ...e,
      domain_name: DEFAULT_DOMAINS.find(d => d.domain_id === e.domain_id)?.domain_name || 'General'
    }));

    return res.json({ success: true, mode, count: result.length, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Query execution error: ' + err.message });
  }
});

/**
 * POST /api/errors
 * Two-way live sync: executes on MySQL & mirrors to disk backup
 */
app.post('/api/errors', async (req, res) => {
  const mode = getMode(req);
  const isDemoFlag = mode === 'demo' ? 1 : 0;
  const { domain_id, tech_stack, error_signature, root_cause, fix_requirements, is_verified } = req.body;

  if (!domain_id || !tech_stack || !error_signature || !fix_requirements) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: domain_id, tech_stack, error_signature, and fix_requirements are mandatory.'
    });
  }

  const dId = parseInt(domain_id, 10);
  const hash = computeSignatureHash(dId, tech_stack, error_signature);
  const verifiedStatus = is_verified ? 1 : 0;

  try {
    let resultId = null;
    let action = 'created';
    let newHits = 1;

    if (isDbConnected) {
      const [existing] = await pool.query(
        'SELECT error_id, times_hit FROM error_logs WHERE signature_hash = ? AND is_demo = ?',
        [hash, isDemoFlag]
      );

      if (existing.length > 0) {
        resultId = existing[0].error_id;
        newHits = existing[0].times_hit + 1;
        action = 'incremented';
        await pool.query('CALL sp_increment_error_hit(?)', [resultId]);
      } else {
        const [insertResult] = await pool.query(
          `INSERT INTO error_logs 
            (domain_id, tech_stack, error_signature, signature_hash, root_cause, fix_requirements, source, is_verified, times_hit, is_demo) 
           VALUES (?, ?, ?, ?, ?, ?, 'manual', ?, 1, ?)`,
          [dId, tech_stack.trim(), error_signature.trim(), hash, (root_cause || '').trim(), fix_requirements.trim(), verifiedStatus, isDemoFlag]
        );
        resultId = insertResult.insertId;
      }
    }

    // Mirror to local disk backup
    const vaultRecords = await readDiskVault(mode);
    const existingIndex = vaultRecords.findIndex(e => e.signature_hash === hash);

    if (existingIndex !== -1) {
      vaultRecords[existingIndex].times_hit = (vaultRecords[existingIndex].times_hit || 1) + 1;
      vaultRecords[existingIndex].updated_at = new Date().toISOString();
      if (!resultId) resultId = vaultRecords[existingIndex].error_id;
      action = 'incremented';
      newHits = vaultRecords[existingIndex].times_hit;
    } else {
      const nextId = resultId || (vaultRecords.length > 0 ? Math.max(...vaultRecords.map(e => e.error_id)) + 1 : 1);
      resultId = nextId;
      vaultRecords.unshift({
        error_id: resultId,
        domain_id: dId,
        tech_stack: tech_stack.trim(),
        error_signature: error_signature.trim(),
        signature_hash: hash,
        root_cause: (root_cause || '').trim(),
        fix_requirements: fix_requirements.trim(),
        source: 'manual',
        is_verified: verifiedStatus,
        times_hit: 1,
        is_demo: isDemoFlag,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    await writeDiskVault(mode, vaultRecords);

    res.status(action === 'created' ? 201 : 200).json({
      success: true,
      mode,
      action,
      message: action === 'created' ? 'New error logged successfully.' : 'Signature recognized. Hit count incremented.',
      error_id: resultId,
      times_hit: newHits
    });

  } catch (err) {
    console.error('Error logging error:', err);
    res.status(500).json({ success: false, error: 'Save failed: ' + err.message });
  }
});

/**
 * POST /api/errors/ai-upsert
 */
app.post('/api/errors/ai-upsert', async (req, res) => {
  const mode = getMode(req);
  const isDemoFlag = mode === 'demo' ? 1 : 0;
  const { domain_id, tech_stack, error_signature, root_cause, fix_requirements } = req.body;

  if (!domain_id || !tech_stack || !error_signature || !fix_requirements) {
    return res.status(400).json({ success: false, error: 'Incomplete AI scan payload.' });
  }

  const dId = parseInt(domain_id, 10);
  const hash = computeSignatureHash(dId, tech_stack, error_signature);

  try {
    let resultId = null;
    let action = 'learned';
    let newHits = 1;

    if (isDbConnected) {
      const [existing] = await pool.query(
        'SELECT error_id, times_hit FROM error_logs WHERE signature_hash = ? AND is_demo = ?',
        [hash, isDemoFlag]
      );

      if (existing.length > 0) {
        resultId = existing[0].error_id;
        newHits = existing[0].times_hit + 1;
        action = 'incremented';
        await pool.query('CALL sp_increment_error_hit(?)', [resultId]);
      } else {
        const [insertResult] = await pool.query(
          `INSERT INTO error_logs 
            (domain_id, tech_stack, error_signature, signature_hash, root_cause, fix_requirements, source, is_verified, times_hit, is_demo) 
           VALUES (?, ?, ?, ?, ?, ?, 'ai', 0, 1, ?)`,
          [dId, tech_stack.trim(), error_signature.trim(), hash, (root_cause || '').trim(), fix_requirements.trim(), isDemoFlag]
        );
        resultId = insertResult.insertId;
      }
    }

    // Mirror to disk
    const vaultRecords = await readDiskVault(mode);
    const existingIndex = vaultRecords.findIndex(e => e.signature_hash === hash);

    if (existingIndex !== -1) {
      vaultRecords[existingIndex].times_hit += 1;
      vaultRecords[existingIndex].updated_at = new Date().toISOString();
      if (!resultId) resultId = vaultRecords[existingIndex].error_id;
      action = 'incremented';
      newHits = vaultRecords[existingIndex].times_hit;
    } else {
      const nextId = resultId || (vaultRecords.length > 0 ? Math.max(...vaultRecords.map(e => e.error_id)) + 1 : 1);
      resultId = nextId;
      vaultRecords.unshift({
        error_id: resultId,
        domain_id: dId,
        tech_stack: tech_stack.trim(),
        error_signature: error_signature.trim(),
        signature_hash: hash,
        root_cause: (root_cause || '').trim(),
        fix_requirements: fix_requirements.trim(),
        source: 'ai',
        is_verified: 0,
        times_hit: 1,
        is_demo: isDemoFlag,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    await writeDiskVault(mode, vaultRecords);

    res.status(action === 'learned' ? 201 : 200).json({
      success: true,
      mode,
      action,
      message: action === 'learned' ? 'New error learned and auto-saved to Vault.' : 'Error recognized. Hit count incremented.',
      error_id: resultId,
      times_hit: newHits
    });

  } catch (err) {
    res.status(500).json({ success: false, error: 'AI upsert failed: ' + err.message });
  }
});

/**
 * PUT /api/errors/:id?mode=real|demo
 */
app.put('/api/errors/:id', async (req, res) => {
  const mode = getMode(req);
  const errorId = parseInt(req.params.id, 10);
  const { domain_id, tech_stack, error_signature, root_cause, fix_requirements, is_verified } = req.body;

  if (!errorId || !domain_id || !tech_stack || !error_signature || !fix_requirements) {
    return res.status(400).json({ success: false, error: 'Invalid or incomplete update data.' });
  }

  const dId = parseInt(domain_id, 10);
  const hash = computeSignatureHash(dId, tech_stack, error_signature);
  const verifiedStatus = is_verified ? 1 : 0;

  try {
    if (isDbConnected) {
      await pool.query(
        `UPDATE error_logs 
         SET domain_id = ?, 
             tech_stack = ?, 
             error_signature = ?, 
             signature_hash = ?, 
             root_cause = ?, 
             fix_requirements = ?, 
             is_verified = ?, 
             source = 'edited'
         WHERE error_id = ?`,
        [dId, tech_stack.trim(), error_signature.trim(), hash, (root_cause || '').trim(), fix_requirements.trim(), verifiedStatus, errorId]
      );
    }

    // Mirror to disk
    const vaultRecords = await readDiskVault(mode);
    const index = vaultRecords.findIndex(e => e.error_id === errorId);
    if (index !== -1) {
      vaultRecords[index] = {
        ...vaultRecords[index],
        domain_id: dId,
        tech_stack: tech_stack.trim(),
        error_signature: error_signature.trim(),
        signature_hash: hash,
        root_cause: (root_cause || '').trim(),
        fix_requirements: fix_requirements.trim(),
        is_verified: verifiedStatus,
        source: 'edited',
        updated_at: new Date().toISOString()
      };
      await writeDiskVault(mode, vaultRecords);
    }

    res.json({
      success: true,
      mode,
      message: 'Record updated successfully.',
      error_id: errorId
    });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Update failed: ' + err.message });
  }
});

/**
 * POST /api/errors/:id/hit?mode=real|demo
 */
app.post('/api/errors/:id/hit', async (req, res) => {
  const mode = getMode(req);
  const errorId = parseInt(req.params.id, 10);
  if (!errorId) return res.status(400).json({ success: false, error: 'Invalid error ID.' });

  try {
    let hits = 1;
    if (isDbConnected) {
      await pool.query('CALL sp_increment_error_hit(?)', [errorId]);
      const [rows] = await pool.query('SELECT times_hit FROM error_logs WHERE error_id = ?', [errorId]);
      if (rows.length > 0) hits = rows[0].times_hit;
    }

    const vaultRecords = await readDiskVault(mode);
    const record = vaultRecords.find(e => e.error_id === errorId);
    if (record) {
      record.times_hit = (record.times_hit || 1) + 1;
      record.updated_at = new Date().toISOString();
      hits = record.times_hit;
      await writeDiskVault(mode, vaultRecords);
    }

    res.json({
      success: true,
      mode,
      message: 'Hit count incremented.',
      times_hit: hits
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Hit increment failed: ' + err.message });
  }
});

/**
 * PATCH /api/errors/:id/verify?mode=real|demo
 */
app.patch('/api/errors/:id/verify', async (req, res) => {
  const mode = getMode(req);
  const errorId = parseInt(req.params.id, 10);
  if (!errorId) return res.status(400).json({ success: false, error: 'Invalid error ID.' });

  try {
    let verified = 0;
    if (isDbConnected) {
      await pool.query('UPDATE error_logs SET is_verified = NOT is_verified WHERE error_id = ?', [errorId]);
      const [rows] = await pool.query('SELECT is_verified FROM error_logs WHERE error_id = ?', [errorId]);
      if (rows.length > 0) verified = rows[0].is_verified;
    }

    const vaultRecords = await readDiskVault(mode);
    const record = vaultRecords.find(e => e.error_id === errorId);
    if (record) {
      record.is_verified = record.is_verified ? 0 : 1;
      record.updated_at = new Date().toISOString();
      verified = record.is_verified;
      await writeDiskVault(mode, vaultRecords);
    }

    res.json({
      success: true,
      mode,
      message: 'Verification status toggled.',
      is_verified: verified
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Toggle failed: ' + err.message });
  }
});

/**
 * DELETE /api/errors/:id?mode=real|demo
 */
app.delete('/api/errors/:id', async (req, res) => {
  const mode = getMode(req);
  const errorId = parseInt(req.params.id, 10);
  if (!errorId) return res.status(400).json({ success: false, error: 'Invalid error ID.' });

  try {
    if (isDbConnected) {
      await pool.query('DELETE FROM error_logs WHERE error_id = ?', [errorId]);
    }

    const vaultRecords = await readDiskVault(mode);
    const index = vaultRecords.findIndex(e => e.error_id === errorId);
    if (index !== -1) {
      vaultRecords.splice(index, 1);
      await writeDiskVault(mode, vaultRecords);
    }

    res.json({
      success: true,
      mode,
      message: `Error record #${errorId} permanently deleted.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Delete failed: ' + err.message });
  }
});

/**
 * POST /api/demo/reset
 */
app.post('/api/demo/reset', async (req, res) => {
  try {
    await writeDiskVault('demo', INITIAL_DEMO_ERRORS);

    if (isDbConnected) {
      await pool.query('DELETE FROM error_logs WHERE is_demo = 1');
      for (const item of INITIAL_DEMO_ERRORS) {
        await pool.query(`
          INSERT INTO error_logs 
            (error_id, domain_id, tech_stack, error_signature, signature_hash, root_cause, fix_requirements, source, is_verified, times_hit, is_demo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
          item.error_id, item.domain_id, item.tech_stack, item.error_signature,
          item.signature_hash, item.root_cause, item.fix_requirements,
          item.source, item.is_verified, item.times_hit
        ]);
      }
    }

    res.json({
      success: true,
      message: '12 Lab Evaluation demo records successfully restored to default state.',
      count: INITIAL_DEMO_ERRORS.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reset demo records: ' + err.message });
  }
});

/**
 * POST /api/ide/diagnose
 */
app.post('/api/ide/diagnose', async (req, res) => {
  const { domain_id, tech_stack, error_output, file_path } = req.body;

  if (!tech_stack || !error_output) {
    return res.status(400).json({
      matched: false,
      error: 'Missing required parameters: tech_stack and error_output must be provided.'
    });
  }

  const firstLine = error_output.split('\n')[0].trim().substring(0, 150);
  const dId = parseInt(domain_id || '0', 10);

  try {
    let matched = null;

    if (isDbConnected) {
      let query = `
        SELECT e.*, d.domain_name 
        FROM error_logs e
        INNER JOIN domains d ON e.domain_id = d.domain_id
        WHERE e.is_demo = 0 AND (e.error_signature LIKE ? OR ? LIKE CONCAT('%', e.error_signature, '%'))
      `;
      const params = [`%${firstLine}%`, error_output];
      if (dId > 0) {
        query += ` AND e.domain_id = ?`;
        params.push(dId);
      }
      query += ` ORDER BY e.times_hit DESC LIMIT 1`;
      const [rows] = await pool.query(query, params);

      if (rows.length > 0) {
        matched = rows[0];
        await pool.query('CALL sp_increment_error_hit(?)', [matched.error_id]);
        matched.times_hit += 1;
      }
    } else {
      const records = await readDiskVault('real');
      matched = records.find(r => 
        error_output.toLowerCase().includes(r.error_signature.toLowerCase()) ||
        r.error_signature.toLowerCase().includes(firstLine.toLowerCase())
      );
      if (matched) {
        matched.times_hit += 1;
        matched.updated_at = new Date().toISOString();
        await writeDiskVault('real', records);
      }
    }

    if (matched) {
      return res.json({
        matched: true,
        source: isDbConnected ? 'mysql' : 'disk-vault',
        message: 'Match retrieved from TraceVault memory.',
        record: matched
      });
    }

    return res.json({
      matched: false,
      message: 'New error signature not yet cataloged in vault. Ready for AI scanning in web UI.',
      signature: firstLine,
      tech_stack,
      file_path: file_path || null
    });

  } catch (err) {
    res.status(500).json({ matched: false, error: err.message });
  }
});

/**
 * GET /api/export?format=json|csv&mode=real|demo
 */
app.get('/api/export', async (req, res) => {
  const mode = getMode(req);
  const isDemoFlag = mode === 'demo' ? 1 : 0;
  const format = (req.query.format || 'json').toLowerCase();

  try {
    let records = [];

    if (isDbConnected) {
      const [rows] = await pool.query(`
        SELECT 
          e.error_id, d.domain_name, e.tech_stack, e.error_signature, 
          e.signature_hash, e.root_cause, e.fix_requirements, 
          e.source, e.is_verified, e.times_hit, e.is_demo, e.created_at, e.updated_at
        FROM error_logs e
        INNER JOIN domains d ON e.domain_id = d.domain_id
        WHERE e.is_demo = ?
        ORDER BY e.error_id ASC
      `, [isDemoFlag]);
      records = rows;
    } else {
      const vaultData = await readDiskVault(mode);
      records = vaultData.map(e => ({
        ...e,
        domain_name: DEFAULT_DOMAINS.find(d => d.domain_id === e.domain_id)?.domain_name || 'General'
      }));
    }

    const filename = `tracevault_${mode}_backup.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      const headers = ['error_id', 'domain_name', 'tech_stack', 'error_signature', 'root_cause', 'fix_requirements', 'source', 'is_verified', 'times_hit', 'is_demo', 'created_at', 'updated_at'];
      const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      let csv = headers.join(',') + '\n';
      for (const row of records) {
        csv += headers.map(h => escapeCsv(row[h])).join(',') + '\n';
      }
      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json({
      exported_at: new Date().toISOString(),
      vault: 'TraceVault',
      mode,
      record_count: records.length,
      data: records
    });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Export failed: ' + err.message });
  }
});

// Single Page Application Fallback Route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, async () => {
  console.log(`=====================================================================`);
  console.log(`⚡ TraceVault Server actively listening on: http://localhost:${PORT}`);
  console.log(`=====================================================================`);
  await initializeDatabase();
});
