-- =====================================================================
-- TraceVault - Self-Learning AI Debug Bot & Error Knowledge Base
-- DBMS Lab Final Project Database Specification & Seed Script
-- Target Engine: MySQL 8.0+ / MariaDB 10.5+
-- Architecture: 3NF Relational Schema with Dual Workspace Separation
-- =====================================================================

-- 1. Database Creation (Idempotent)
CREATE DATABASE IF NOT EXISTS tracevault 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE tracevault;

-- Clean slate: drop objects in dependency order
DROP TRIGGER IF EXISTS trg_error_logs_before_update;
DROP PROCEDURE IF EXISTS sp_increment_error_hit;
DROP VIEW IF EXISTS v_domain_summary;
DROP TABLE IF EXISTS error_logs;
DROP TABLE IF EXISTS domains;

-- =====================================================================
-- 2. Schema Definition (Third Normal Form - 3NF)
-- =====================================================================

-- Parent Table: domains
-- Enforces 1NF (atomic attributes), 2NF (single-attribute primary key), 
-- and 3NF (no transitive dependencies).
CREATE TABLE domains (
  domain_id INT AUTO_INCREMENT PRIMARY KEY,
  domain_name VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Child Table: error_logs
-- Stores deduplicated error signatures with foreign key to domains.
-- Includes is_demo flag to strictly isolate Real Workspace (0) from Lab Demo Sandbox (1).
CREATE TABLE error_logs (
  error_id INT AUTO_INCREMENT PRIMARY KEY,
  domain_id INT NOT NULL,
  tech_stack VARCHAR(50) NOT NULL,
  error_signature VARCHAR(255) NOT NULL,
  signature_hash CHAR(64) NOT NULL UNIQUE,
  root_cause VARCHAR(255) DEFAULT NULL,
  fix_requirements TEXT NOT NULL,
  source ENUM('ai', 'manual', 'edited') NOT NULL DEFAULT 'manual',
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  times_hit INT NOT NULL DEFAULT 1 CHECK (times_hit >= 1),
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_error_domain FOREIGN KEY (domain_id) 
    REFERENCES domains(domain_id) 
    ON UPDATE CASCADE 
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance & Query Optimization Indexes
CREATE INDEX idx_domain_id ON error_logs (domain_id);
CREATE INDEX idx_tech_stack ON error_logs (tech_stack);
CREATE INDEX idx_error_signature ON error_logs (error_signature);
CREATE INDEX idx_times_hit ON error_logs (times_hit);
CREATE INDEX idx_is_demo ON error_logs (is_demo);
CREATE INDEX idx_updated_at ON error_logs (updated_at);

-- =====================================================================
-- 3. Advanced Relational Objects
-- =====================================================================

-- 3.1 Trigger: Automatically update updated_at timestamp on record updates
DELIMITER //
CREATE TRIGGER trg_error_logs_before_update
BEFORE UPDATE ON error_logs
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- 3.2 Stored Procedure: Atomic hit counter increment
DELIMITER //
CREATE PROCEDURE sp_increment_error_hit (
  IN p_error_id INT
)
BEGIN
  UPDATE error_logs 
  SET times_hit = times_hit + 1 
  WHERE error_id = p_error_id;
END //
DELIMITER ;

-- 3.3 Analytical View: Domain Summary Aggregation
CREATE VIEW v_domain_summary AS
SELECT
  d.domain_id,
  d.domain_name,
  COUNT(e.error_id) AS total_errors,
  COALESCE(SUM(e.times_hit), 0) AS total_hits,
  ROUND(COALESCE(AVG(e.times_hit), 0), 1) AS avg_hits,
  COALESCE(MAX(e.times_hit), 0) AS max_hits,
  COALESCE(MIN(e.times_hit), 0) AS min_hits
FROM domains d
LEFT JOIN error_logs e ON d.domain_id = e.domain_id
GROUP BY d.domain_id, d.domain_name;

-- =====================================================================
-- 4. Seed Data (16 Total Relational Records)
-- =====================================================================

-- 4.1 Seed Domains (4 Rows)
INSERT INTO domains (domain_id, domain_name) VALUES
(1, 'Frontend'),
(2, 'Backend'),
(3, 'Database'),
(4, 'Fullstack');

-- 4.2 Seed Error Logs (12 Rows across 4 domains)
-- NOTE: All seed records are flagged with is_demo = 1 for the University Lab Sandbox.
-- The Real Developer Workspace (is_demo = 0) starts strictly clean at 0 records.
INSERT INTO error_logs (
  domain_id, tech_stack, error_signature, signature_hash, 
  root_cause, fix_requirements, source, is_verified, times_hit, is_demo
) VALUES
-- --- Frontend Domain ---
(
  1, 
  'React', 
  'Cannot read properties of undefined (reading \'map\')',
  '54bd8abe41415e13fb4a68ad28bc1345bec1e3ec62c00c7f27623df9b040b2cd',
  'State array initialized as undefined prior to async fetch completion.',
  '1. Initialize state with empty array: const [items, setItems] = useState([]);\n2. Use optional chaining and fallback: (items || []).map(...)\n3. Add conditional loading spinner before rendering list.',
  'ai', 
  1, 
  9,
  1
),
(
  1, 
  'JavaScript', 
  'Uncaught TypeError: Assignment to constant variable.',
  'f12bd80a8b3ed1876012fe73b42438c17f9946f45ff31098db86fd71aa2a8cf8',
  'Attempting to reassign a variable declared with the const keyword.',
  '1. Declare the identifier with let instead of const if value must change.\n2. If operating on an object/array, mutate properties rather than reassigning the identifier binding.',
  'manual', 
  1, 
  4,
  1
),
(
  1, 
  'CSS / Webpack', 
  'ChunkLoadError: Loading chunk failed',
  '47382b5fb6c9d4aca7fdc0d4dc4cd55422cdaaac2f44036b4bc3c33fe2f019d0',
  'Dynamic bundle chunk missing or network cache mismatch following recent build deployment.',
  '1. Catch dynamic import error and invoke window.location.reload(true) once.\n2. Configure output.publicPath and disable aggressive browser caching on index.html.',
  'manual', 
  0, 
  3,
  1
),

-- --- Backend Domain ---
(
  2, 
  'Node.js', 
  'Error: listen EADDRINUSE: address already in use :::3000',
  '866d0cb159d48348e57bea3402d4f1ccf8382242b55ffcc6a9684e96a0e9177e',
  'Another background instance or node process is actively bound to port 3000.',
  '1. Identify and terminate the occupying PID: npx kill-port 3000\n2. Configure dynamic fallback: const PORT = process.env.PORT || 3001;\n3. Gracefully close server on SIGINT / SIGTERM signals.',
  'manual', 
  1, 
  12,
  1
),
(
  2, 
  'Express', 
  'Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client',
  'ea8f8511ed638ac5d9b727a6b5455a7116ae70f2c32e15bde8e69532ebcdc159',
  'Attempting multiple res.json() or res.send() calls in a single execution branch without returning.',
  '1. Always return immediately on sending response: return res.status(400).json(...);\n2. Verify async middleware next() is not called after sending headers.',
  'ai', 
  1, 
  7,
  1
),
(
  2, 
  'Python / Flask', 
  'ModuleNotFoundError: No module named \'jwt\'',
  'd5a3f7aebe65bf884a0c8ec65e6b9fbd519bafe403308b0f9d9bc2caa642a1e1',
  'PyJWT or dependencies not installed in the currently active virtual environment.',
  '1. Activate corresponding venv (.venv/Scripts/activate).\n2. Install required library: pip install PyJWT cryptography\n3. Freeze dependencies to requirements.txt.',
  'manual', 
  0, 
  2,
  1
),

-- --- Database Domain ---
(
  3, 
  'MySQL', 
  'Error 1452: Cannot add or update a child row: a foreign key constraint fails',
  '22009c398b1e1a69918ffea4d521f507967ac86dbce287384b2b8fc869c4c13c',
  'Attempting to insert a foreign key reference that does not exist in the referenced parent table.',
  '1. Ensure parent record exists in referenced table before inserting child row.\n2. Check datatype and sign consistency between FK and PK columns (e.g. INT vs INT UNSIGNED).',
  'manual', 
  1, 
  8,
  1
),
(
  3, 
  'MySQL Pool', 
  'Error: Connection lost: The server closed the connection (PROTOCOL_CONNECTION_LOST)',
  '92e73db0db3b5a98a9a05578c438e47efe358e0780d46b79a5d9e25d537186bd',
  'Idle timeout exceeded on TCP socket or MySQL wait_timeout dropped connection.',
  '1. Use mysql2 pool with enableKeepAlive: true and keepAliveInitialDelay: 10000.\n2. Handle connection error events and implement exponential backoff reconnection.',
  'ai', 
  1, 
  5,
  1
),
(
  3, 
  'MongoDB', 
  'MongooseServerSelectionError: Server selection timed out after 30000 ms',
  '8b301c80854f6ee462c3a7398b93188e6aa44167cde17e079890495872c4b2f0',
  'Cluster IP access list blocks client IP, or cluster primary is unreachable.',
  '1. Whitelist current public IP (or 0.0.0.0/0 for testing) in MongoDB Atlas Network Access.\n2. Verify cluster URI connection string and credentials in .env.',
  'manual', 
  0, 
  3,
  1
),

-- --- Fullstack Domain ---
(
  4, 
  'Web API / CORS', 
  'Access to fetch at origin has been blocked by CORS policy: No \'Access-Control-Allow-Origin\' header',
  '5a58e7bd0031b6b11266738cbb39c02b844053014ec9b0d999576487e6e570f9',
  'Backend server lacks appropriate Cross-Origin Resource Sharing response headers.',
  '1. Install cors package: npm install cors\n2. Add middleware before routes: app.use(cors({ origin: \'http://localhost:3000\', credentials: true }));\n3. Handle preflight OPTIONS requests.',
  'manual', 
  1, 
  15,
  1
),
(
  4, 
  'Auth / JWT', 
  'JsonWebTokenError: invalid signature',
  '7a8ea0f68c7e53043c0a74f4e5182e9d5fca19f852091e2fff4203c202e9f6da',
  'JWT signed with a different secret key than the verification algorithm expects, or secret is undefined.',
  '1. Verify JWT_SECRET is loaded from process.env before jwt.verify() is executed.\n2. Ensure symmetric algorithm (HS256) is consistently specified on sign and verify.',
  'ai', 
  1, 
  6,
  1
),
(
  4, 
  'Next.js', 
  'Error: Text content does not match server-rendered HTML (Hydration failed)',
  '85f20b52798fd4409df87a88816ac12cee783c108d4fc04bea84394121f9dcae',
  'Component rendered different HTML output on server vs client (e.g. typeof window or Date.now()).',
  '1. Defer client-only rendering using useEffect or dynamic import with ssr: false.\n2. Avoid browser-only APIs (localStorage, navigator) during initial component render.',
  'ai', 
  1, 
  11,
  1
);

-- =====================================================================
-- 5. Verification & Demonstration Queries (Lab Evaluation)
-- =====================================================================

-- Query 1: Display Lab Demo sandbox records (is_demo = 1)
SELECT 
  e.error_id,
  d.domain_name,
  e.tech_stack,
  e.error_signature,
  e.times_hit,
  e.source,
  e.is_verified,
  e.is_demo,
  e.updated_at
FROM error_logs e
INNER JOIN domains d ON e.domain_id = d.domain_id
WHERE e.is_demo = 1
ORDER BY e.times_hit DESC;

-- Query 2: Aggregate statistics for Lab Demo records
SELECT 
  COUNT(*) AS total_errors,
  SUM(times_hit) AS total_hits,
  ROUND(AVG(times_hit), 1) AS avg_hits,
  MAX(times_hit) AS max_hits,
  MIN(times_hit) AS min_hits
FROM error_logs
WHERE is_demo = 1;

-- Query 3: Query analytical domain summary view
SELECT * FROM v_domain_summary ORDER BY domain_id;

-- Query 4: Test Stored Procedure hit counter increment on error_id = 1
CALL sp_increment_error_hit(1);

-- Verify hit counter incremented
SELECT error_id, error_signature, times_hit, updated_at 
FROM error_logs 
WHERE error_id = 1;
