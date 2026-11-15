const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    const sqlPath = path.join(__dirname, 'database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await connection.query(sql);
    const [domains] = await connection.query('SELECT COUNT(*) AS count FROM tracevault.domains');
    const [errors] = await connection.query('SELECT COUNT(*) AS count FROM tracevault.error_logs');
    console.log(`[MySQL Setup Complete] domains: ${domains[0].count} rows, error_logs: ${errors[0].count} rows.`);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  setupDatabase().catch((err) => {
    console.error('[MySQL Setup Error]:', err.message);
    process.exit(1);
  });
}

module.exports = setupDatabase;