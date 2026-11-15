CREATE DATABASE IF NOT EXISTS tracevault
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tracevault;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS error_logs;
DROP TABLE IF EXISTS domains;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS domains (
  domain_id INT AUTO_INCREMENT PRIMARY KEY,
  domain_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS error_logs (
  error_id INT AUTO_INCREMENT PRIMARY KEY,
  domain_id INT NOT NULL,
  tech_stack VARCHAR(100) NOT NULL,
  error_signature VARCHAR(255) NOT NULL,
  signature_hash CHAR(64) NOT NULL UNIQUE,
  root_cause TEXT NOT NULL,
  fix_requirements TEXT NOT NULL,
  times_hit INT NOT NULL DEFAULT 1 CHECK (times_hit >= 1),
  is_verified TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_error_domain
    FOREIGN KEY (domain_id) REFERENCES domains (domain_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO domains (domain_id, domain_name, description) VALUES
(1, 'Frontend', 'Client-side rendering, DOM state, React hooks, and browser CORS policies'),
(2, 'Backend', 'Node.js runtime, Express middleware, async lifecycle, and API routing'),
(3, 'Database', 'MySQL relational schema, foreign key constraints, indexing, and deadlocks'),
(4, 'Fullstack', 'End-to-end authentication, JWT session tokens, and deployment pipelines');

INSERT INTO error_logs (error_id, domain_id, tech_stack, error_signature, signature_hash, root_cause, fix_requirements, times_hit, is_verified) VALUES
(1, 1, 'Fetch API / CORS', 'Access to fetch at origin has been blocked by CORS policy', SHA2(LOWER('Access to fetch at origin has been blocked by CORS policy'), 256), 'Express backend response is missing Access-Control-Allow-Origin headers for cross-origin browser requests.', 'Configure cors() middleware in server.js with explicit origin and credentials support.', 15, 1),
(2, 1, 'React 18 / Hooks', 'Too many re-renders. React limits the number of renders to prevent an infinite loop', SHA2(LOWER('Too many re-renders. React limits the number of renders to prevent an infinite loop'), 256), 'State setter function is invoked directly inside the component render body instead of an event handler or useEffect.', 'Wrap the state update call inside an arrow function onClick={() => setCount(c + 1)} or useEffect hook with a dependency array.', 9, 1),
(3, 1, 'Next.js 14 / SSR', 'Hydration failed because the initial UI does not match what was rendered on the server', SHA2(LOWER('Hydration failed because the initial UI does not match what was rendered on the server'), 256), 'Non-deterministic values like Date.now(), Math.random(), or browser-only window objects were used during initial SSR render.', 'Defer browser-specific rendering to a client-side useEffect hook after component mount.', 7, 1),
(4, 2, 'Node.js / Express', 'Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client', SHA2(LOWER('Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client'), 256), 'Multiple res.json() or res.send() calls executed in the same route handler because a return statement was omitted.', 'Add an explicit return statement before every res.status().json() call inside conditional branches.', 12, 1),
(5, 2, 'Node.js / TCP', 'Error: listen EADDRINUSE: address already in use :::3000', SHA2(LOWER('Error: listen EADDRINUSE: address already in use :::3000'), 256), 'Another Node.js process is already bound to TCP port 3000 from a previous unclosed terminal session.', 'Terminate the orphaned process using taskkill /F /IM node.exe or configure a fallback port in environment variables.', 6, 1),
(6, 2, 'Express / JSON', 'SyntaxError: Unexpected token in JSON at position 0 in body-parser', SHA2(LOWER('SyntaxError: Unexpected token in JSON at position 0 in body-parser'), 256), 'Client sent a malformed JSON payload or unquoted string with Content-Type: application/json header.', 'Validate JSON payload structure on the client before fetch() and add an Express JSON syntax error middleware.', 5, 1),
(7, 3, 'MySQL 8.0 / InnoDB', 'ER_NO_REFERENCED_ROW_2: Cannot add or update a child row: a foreign key constraint fails', SHA2(LOWER('ER_NO_REFERENCED_ROW_2: Cannot add or update a child row: a foreign key constraint fails'), 256), 'Attempted to insert an error_logs record with a domain_id that does not exist in the parent domains table.', 'Verify that domain_id exists in the domains table before executing INSERT INTO error_logs.', 11, 1),
(8, 3, 'MySQL 8.0 / SQL', 'ER_DUP_ENTRY: Duplicate entry for key error_logs.signature_hash', SHA2(LOWER('ER_DUP_ENTRY: Duplicate entry for key error_logs.signature_hash'), 256), 'Submitted an error_signature whose SHA-256 hash already exists in the error_logs table.', 'Use INSERT INTO ... ON DUPLICATE KEY UPDATE times_hit = times_hit + 1 to increment existing occurrence counts.', 4, 1),
(9, 3, 'mysql2 / Pool', 'Error: connect ECONNREFUSED 127.0.0.1:3306', SHA2(LOWER('Error: connect ECONNREFUSED 127.0.0.1:3306'), 256), 'Local MySQL / MariaDB service on port 3306 is stopped or blocked by firewall rules.', 'Start the MySQL daemon on port 3306 and verify connection credentials in dbConfig.', 4, 1),
(10, 4, 'JWT / Auth', 'JsonWebTokenError: invalid signature on protected API route', SHA2(LOWER('JsonWebTokenError: invalid signature on protected API route'), 256), 'JWT token was signed with a different secret key than the JWT_SECRET used by the verification middleware.', 'Synchronize JWT_SECRET across token generation and verification modules.', 8, 1),
(11, 4, 'Prisma / Env', 'Error: Environment variable not found: DATABASE_URL', SHA2(LOWER('Error: Environment variable not found: DATABASE_URL'), 256), 'Application started without loading .env configuration or missing DATABASE_URL in deployment environment.', 'Configure dotenv.config() at the top of server.js and provide sensible localhost fallback defaults.', 2, 1),
(12, 4, 'WebSockets / TLS', 'Mixed Content: The page at HTTPS was loaded over HTTPS, but requested an insecure ws:// endpoint', SHA2(LOWER('Mixed Content: The page at HTTPS was loaded over HTTPS, but requested an insecure ws:// endpoint'), 256), 'Hardcoded insecure ws:// or http:// protocol used inside an HTTPS production origin.', 'Use protocol-relative URLs or upgrade connections to wss:// and https:// when window.location.protocol is https:.', 2, 1);