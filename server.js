const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

const app = express();
const PORT = Number(process.env.PORT || 3000);

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tracevault',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

function computeSignatureHash(signature) {
  return crypto
    .createHash('sha256')
    .update(String(signature || '').trim().toLowerCase())
    .digest('hex');
}

async function initDatabasePool() {
  try {
    const bootConn = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true
    });
    const [tables] = await bootConn.query(
      "SHOW TABLES FROM `tracevault` LIKE 'error_logs'"
    ).catch(() => [[]]);

    if (!tables || tables.length === 0) {
      const sqlFile = path.join(__dirname, 'database.sql');
      if (fs.existsSync(sqlFile)) {
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        await bootConn.query(sqlContent);
      }
    } else {
      // Ensure required columns exist even on older database instances
      await bootConn.query("USE `tracevault`");
      const [cols] = await bootConn.query("SHOW COLUMNS FROM `error_logs`");
      const colNames = cols.map((c) => c.Field);
      if (!colNames.includes('fix_requirements') && colNames.includes('fixed_code')) {
        await bootConn.query("ALTER TABLE `error_logs` CHANGE `fixed_code` `fix_requirements` TEXT NOT NULL");
      }
      if (!colNames.includes('is_verified')) {
        await bootConn.query("ALTER TABLE `error_logs` ADD COLUMN `is_verified` TINYINT(1) NOT NULL DEFAULT 1");
      }
    }
    await bootConn.end();
    pool = mysql.createPool(dbConfig);
    console.log('[MySQL 3306] Connection pool initialized successfully.');
  } catch (err) {
    console.error('[MySQL Init Warning]:', err.message);
    pool = mysql.createPool(dbConfig);
  }
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Health Check Route
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 AS ok');
    return res.json({ success: true, database: 'MySQL 3306', status: 'connected', ok: rows[0].ok });
  } catch (err) {
    return res.status(503).json({ success: false, database: 'offline', error: err.message });
  }
});

// 2. Get All Parent Domains (with bug counts via LEFT JOIN)
app.get('/api/domains', async (req, res) => {
  try {
    const sql = `
      SELECT d.domain_id, d.domain_name, d.description,
             COUNT(e.error_id) AS bug_count,
             COALESCE(SUM(e.times_hit), 0) AS total_hits
      FROM domains d
      LEFT JOIN error_logs e ON d.domain_id = e.domain_id
      GROUP BY d.domain_id, d.domain_name, d.description
      ORDER BY d.domain_id ASC
    `;
    const [rows] = await pool.execute(sql);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[GET /api/domains Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Add a New Domain Category
app.post('/api/domains', async (req, res) => {
  try {
    const domain_name = String(req.body.domain_name || '').trim();
    const description = String(req.body.description || 'Custom engineering domain category').trim();
    if (!domain_name || domain_name.length > 50) {
      return res.status(400).json({ success: false, error: 'Domain name is required (max 50 chars).' });
    }
    const [result] = await pool.execute(
      'INSERT INTO domains (domain_name, description) VALUES (?, ?)',
      [domain_name, description]
    );
    return res.status(201).json({
      success: true,
      data: { domain_id: result.insertId, domain_name, description, bug_count: 0 }
    });
  } catch (err) {
    console.error('[POST /api/domains Error]:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'Domain category already exists.' });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Delete Unused Domain Category
app.delete('/api/domains/:id', async (req, res) => {
  try {
    const domainId = Number(req.params.id);
    if (!Number.isInteger(domainId) || domainId <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid domain ID.' });
    }
    const [usage] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM error_logs WHERE domain_id = ?',
      [domainId]
    );
    if (Number(usage[0].cnt) > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete domain because ${usage[0].cnt} error record(s) reference it (Foreign Key RESTRICT).`
      });
    }
    await pool.execute('DELETE FROM domains WHERE domain_id = ?', [domainId]);
    return res.json({ success: true, message: 'Domain category deleted successfully.' });
  } catch (err) {
    console.error('[DELETE /api/domains/:id Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Get Aggregate Summary Statistics (COUNT, SUM, AVG, MAX, MIN)
app.get('/api/stats', async (req, res) => {
  try {
    const { domain_id, search } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (domain_id && domain_id !== 'all') {
      whereClause += ' AND e.domain_id = ?';
      params.push(Number(domain_id));
    }
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      const likeTerm = `%${q}%`;
      const numericId = Number(q.replace(/^#/, ''));
      if (Number.isInteger(numericId) && numericId > 0) {
        whereClause += ' AND (e.error_id = ? OR e.error_signature LIKE ? OR e.tech_stack LIKE ? OR e.root_cause LIKE ? OR e.fix_requirements LIKE ?)';
        params.push(numericId, likeTerm, likeTerm, likeTerm, likeTerm);
      } else {
        whereClause += ' AND (e.error_signature LIKE ? OR e.tech_stack LIKE ? OR e.root_cause LIKE ? OR e.fix_requirements LIKE ?)';
        params.push(likeTerm, likeTerm, likeTerm, likeTerm);
      }
    }

    const aggSql = `
      SELECT
        COUNT(e.error_id) AS total_bugs,
        COALESCE(SUM(e.times_hit), 0) AS total_hits,
        COALESCE(ROUND(AVG(e.times_hit), 1), 0.0) AS avg_hits,
        COALESCE(MAX(e.times_hit), 0) AS max_hits,
        COALESCE(MIN(e.times_hit), 0) AS min_hits,
        COALESCE(SUM(CASE WHEN e.is_verified = 1 THEN 1 ELSE 0 END), 0) AS verified_count
      FROM error_logs e
      ${whereClause}
    `;
    const [aggRows] = await pool.execute(aggSql, params);
    const stats = aggRows[0] || {};

    return res.json({
      success: true,
      data: {
        total_bugs: Number(stats.total_bugs || 0),
        total_hits: Number(stats.total_hits || 0),
        avg_hits: Number(stats.avg_hits || 0),
        max_hits: Number(stats.max_hits || 0),
        min_hits: Number(stats.min_hits || 0),
        verified_count: Number(stats.verified_count || 0)
      }
    });
  } catch (err) {
    console.error('[GET /api/stats Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Get Error Records (SELECT + INNER JOIN + WHERE + LIKE including root_cause)
app.get('/api/errors', async (req, res) => {
  try {
    const { domain_id, search } = req.query;
    let sql = `
      SELECT e.error_id, e.domain_id, d.domain_name, e.tech_stack,
             e.error_signature, e.signature_hash, e.root_cause,
             e.fix_requirements, e.times_hit, e.is_verified, e.created_at
      FROM error_logs e
      INNER JOIN domains d ON e.domain_id = d.domain_id
      WHERE 1=1
    `;
    const params = [];

    if (domain_id && domain_id !== 'all') {
      sql += ' AND e.domain_id = ?';
      params.push(Number(domain_id));
    }
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      const term = `%${q}%`;
      const numericId = Number(q.replace(/^#/, ''));
      if (Number.isInteger(numericId) && numericId > 0) {
        sql += ' AND (e.error_id = ? OR e.error_signature LIKE ? OR e.tech_stack LIKE ? OR e.root_cause LIKE ? OR e.fix_requirements LIKE ? OR d.domain_name LIKE ?)';
        params.push(numericId, term, term, term, term, term);
      } else {
        sql += ' AND (e.error_signature LIKE ? OR e.tech_stack LIKE ? OR e.root_cause LIKE ? OR e.fix_requirements LIKE ? OR d.domain_name LIKE ?)';
        params.push(term, term, term, term, term);
      }
    }

    sql += ' ORDER BY e.error_id ASC';
    const [rows] = await pool.execute(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[GET /api/errors Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Add New Error Record (INSERT with SHA-256 signature_hash & ON DUPLICATE KEY UPDATE)
app.post('/api/errors', async (req, res) => {
  try {
    const domain_id = Number(req.body.domain_id);
    const tech_stack = String(req.body.tech_stack || '').trim();
    const error_signature = String(req.body.error_signature || '').trim();
    const root_cause = String(req.body.root_cause || '').trim();
    const fix_requirements = String(req.body.fix_requirements || req.body.fixed_code || '').trim();
    const times_hit = Math.max(1, Number(req.body.times_hit || 1));
    const is_verified = req.body.is_verified !== undefined ? (Number(req.body.is_verified) ? 1 : 0) : 1;

    if (!domain_id || !tech_stack || !error_signature || !root_cause || !fix_requirements) {
      return res.status(400).json({
        success: false,
        error: 'All fields (Domain, Tech Stack, Error Signature, Root Cause, Fix Requirements) are required.'
      });
    }

    const signature_hash = computeSignatureHash(error_signature);

    const sql = `
      INSERT INTO error_logs
        (domain_id, tech_stack, error_signature, signature_hash, root_cause, fix_requirements, times_hit, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        times_hit = times_hit + VALUES(times_hit),
        domain_id = VALUES(domain_id),
        tech_stack = VALUES(tech_stack),
        root_cause = VALUES(root_cause),
        fix_requirements = VALUES(fix_requirements),
        is_verified = VALUES(is_verified)
    `;
    const [result] = await pool.execute(sql, [
      domain_id,
      tech_stack,
      error_signature,
      signature_hash,
      root_cause,
      fix_requirements,
      times_hit,
      is_verified
    ]);

    return res.status(201).json({
      success: true,
      message: 'Bug record saved to MySQL database.',
      data: {
        error_id: result.insertId,
        domain_id,
        tech_stack,
        error_signature,
        signature_hash,
        root_cause,
        fix_requirements,
        times_hit,
        is_verified
      }
    });
  } catch (err) {
    console.error('[POST /api/errors Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Update Existing Error Record (PUT /api/errors/:id with times_hit, is_verified & recomputed hash)
app.put('/api/errors/:id', async (req, res) => {
  try {
    const error_id = Number(req.params.id);
    if (!Number.isInteger(error_id) || error_id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid error_id.' });
    }

    const domain_id = Number(req.body.domain_id);
    const tech_stack = String(req.body.tech_stack || '').trim();
    const error_signature = String(req.body.error_signature || '').trim();
    const root_cause = String(req.body.root_cause || '').trim();
    const fix_requirements = String(req.body.fix_requirements || req.body.fixed_code || '').trim();
    const times_hit = Math.max(1, Number(req.body.times_hit || 1));
    const is_verified = req.body.is_verified !== undefined ? (Number(req.body.is_verified) ? 1 : 0) : 1;

    if (!domain_id || !tech_stack || !error_signature || !root_cause || !fix_requirements) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required to update an error record.'
      });
    }

    const signature_hash = computeSignatureHash(error_signature);

    const [dupCheck] = await pool.execute(
      'SELECT error_id FROM error_logs WHERE signature_hash = ? AND error_id != ?',
      [signature_hash, error_id]
    );
    if (dupCheck.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Another record (#${dupCheck[0].error_id}) already uses this exact Error Signature.`
      });
    }

    const sql = `
      UPDATE error_logs
      SET domain_id = ?,
          tech_stack = ?,
          error_signature = ?,
          signature_hash = ?,
          root_cause = ?,
          fix_requirements = ?,
          times_hit = ?,
          is_verified = ?
      WHERE error_id = ?
    `;
    const [result] = await pool.execute(sql, [
      domain_id,
      tech_stack,
      error_signature,
      signature_hash,
      root_cause,
      fix_requirements,
      times_hit,
      is_verified,
      error_id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Error record not found.' });
    }

    return res.json({
      success: true,
      message: `Record #${error_id} updated successfully.`,
      data: { error_id, domain_id, tech_stack, error_signature, signature_hash, root_cause, fix_requirements, times_hit, is_verified }
    });
  } catch (err) {
    console.error('[PUT /api/errors/:id Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Delete Error Record (DELETE /api/errors/:id)
app.delete('/api/errors/:id', async (req, res) => {
  try {
    const error_id = Number(req.params.id);
    if (!Number.isInteger(error_id) || error_id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid error_id.' });
    }
    const [result] = await pool.execute('DELETE FROM error_logs WHERE error_id = ?', [error_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Error record not found.' });
    }
    return res.json({ success: true, message: `Record #${error_id} permanently deleted.` });
  } catch (err) {
    console.error('[DELETE /api/errors/:id Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

if (require.main === module) {
  initDatabasePool().then(() => {
    app.listen(PORT, () => {
      console.log(`TraceVault Server running at http://localhost:${PORT}`);
    });
  });
}

module.exports = { app, initDatabasePool };