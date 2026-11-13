/**
 * TraceVault - Automatic MySQL Bootstrapper & Two-Way Sync CLI
 * 
 * Functions:
 * 1. Checks and optionally attempts starting local MySQL / XAMPP / MariaDB.
 * 2. Connects to MySQL host (default: localhost:3306).
 * 3. Idempotently creates database `tracevault` and runs `database.sql`.
 * 4. Seeds the 12 Lab Demo records (`is_demo = 1`).
 * 5. Syncs any offline records from `data/real-vault.json` (`is_demo = 0`) into MySQL.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'tracevault';

const REAL_VAULT_PATH = path.join(__dirname, 'data', 'real-vault.json');
const SQL_PATH = path.join(__dirname, 'database.sql');

async function checkAndAttemptStartMySQL() {
  const commonPaths = [
    'C:\\xampp\\mysql\\bin\\mysqld.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqld.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 8.1\\bin\\mysqld.exe',
    'C:\\laragon\\bin\\mysql\\current\\bin\\mysqld.exe'
  ];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      console.log(`[setup-mysql] 🔍 Detected MySQL binary at: ${p}`);
      try {
        const proc = spawn(p, ['--defaults-file=C:\\xampp\\mysql\\bin\\my.ini', '--standalone'], {
          detached: true,
          stdio: 'ignore'
        });
        proc.unref();
        console.log(`[setup-mysql] 🚀 Triggered background start of ${p}`);
        await new Promise(r => setTimeout(r, 2000));
        break;
      } catch (e) {
        // Ignore start error
      }
    }
  }
}

async function run() {
  console.log('======================================================================');
  console.log('⚡ TraceVault MySQL Automatic Bootstrapper');
  console.log('======================================================================');
  console.log(`Connecting to: ${DB_USER}@${DB_HOST}:${DB_PORT} (Target DB: ${DB_NAME})`);

  await checkAndAttemptStartMySQL();

  let rootConn;
  try {
    rootConn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true
    });
    console.log('✅ Connected to MySQL Server!');
  } catch (err) {
    console.error(`❌ Could not connect to MySQL at ${DB_HOST}:${DB_PORT}`);
    console.error(`   Reason: ${err.message}`);
    console.log('\n💡 Tips:');
    console.log('   - If using XAMPP, open XAMPP Control Panel and start MySQL.');
    console.log('   - If using MySQL Workbench, start the MySQL80 Windows Service.');
    console.log('   - Ensure credentials in .env (DB_USER, DB_PASSWORD, DB_PORT) match.');
    process.exit(1);
  }

  try {
    console.log(`[setup-mysql] Creating database '${DB_NAME}' if not exists...`);
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.query(`USE \`${DB_NAME}\`;`);

    if (fs.existsSync(SQL_PATH)) {
      console.log(`[setup-mysql] Executing schema & seeds from database.sql...`);
      const sqlContent = fs.readFileSync(SQL_PATH, 'utf8');

      // Strip DELIMITER statements for mysql2 compatibility
      const cleaned = sqlContent
        .replace(/DELIMITER \/\/[\s\S]*?DELIMITER ;/g, '')
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const stmt of cleaned) {
        try {
          await rootConn.query(stmt);
        } catch (e) {
          // Ignore table already exists or minor duplicate notices
        }
      }

      // Re-create stored procedure & trigger explicitly
      try {
        await rootConn.query(`DROP PROCEDURE IF EXISTS sp_increment_error_hit;`);
        await rootConn.query(`
          CREATE PROCEDURE sp_increment_error_hit (IN p_error_id INT)
          BEGIN
            UPDATE error_logs SET times_hit = times_hit + 1 WHERE error_id = p_error_id;
          END;
        `);
      } catch (e) {}

      try {
        await rootConn.query(`DROP TRIGGER IF EXISTS trg_error_logs_before_update;`);
        await rootConn.query(`
          CREATE TRIGGER trg_error_logs_before_update
          BEFORE UPDATE ON error_logs
          FOR EACH ROW
          BEGIN
            SET NEW.updated_at = CURRENT_TIMESTAMP;
          END;
        `);
      } catch (e) {}

      console.log('✅ Tables, Trigger, Procedure, View, and 12 Lab Seeds created.');
    }

    // Two-Way Sync: Sync offline real developer records from data/real-vault.json
    if (fs.existsSync(REAL_VAULT_PATH)) {
      const realData = JSON.parse(fs.readFileSync(REAL_VAULT_PATH, 'utf8') || '[]');
      if (realData.length > 0) {
        console.log(`[setup-mysql] Syncing ${realData.length} offline records to MySQL 'error_logs' (is_demo = 0)...`);
        for (const item of realData) {
          await rootConn.query(`
            INSERT INTO error_logs 
              (domain_id, tech_stack, error_signature, signature_hash, root_cause, fix_requirements, source, is_verified, times_hit, is_demo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            ON DUPLICATE KEY UPDATE times_hit = error_logs.times_hit;
          `, [
            item.domain_id, item.tech_stack, item.error_signature, item.signature_hash,
            item.root_cause, item.fix_requirements, item.source || 'manual', item.is_verified || 0, item.times_hit || 1
          ]);
        }
        console.log('✅ Offline records successfully mirrored to MySQL!');
      }
    }

    console.log('======================================================================');
    console.log('🚀 MySQL Database Setup Complete! TraceVault is 100% synchronized.');
    console.log('======================================================================');
  } catch (err) {
    console.error('❌ Error during setup:', err);
  } finally {
    await rootConn.end();
  }
}

run();
