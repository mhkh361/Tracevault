/**
 * TraceVault - MySQL 3306 CLI Inspector
 * Quick diagnostics & verification script for University Lab Viva
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspect() {
  console.log('=====================================================================');
  console.log('🔍 TraceVault MySQL 3306 Inspection');
  console.log('=====================================================================');

  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tracevault'
  };

  try {
    const conn = await mysql.createConnection(config);
    console.log(`🟢 Connected to MySQL on ${config.host}:${config.port}/${config.database}`);

    const [tables] = await conn.query('SHOW TABLES');
    console.log('\n📋 Active Database Objects:');
    console.table(tables);

    const [domains] = await conn.query('SELECT * FROM domains');
    console.log('\n🏷️ Domains (Parent Table):');
    console.table(domains);

    const [errors] = await conn.query('SELECT error_id, domain_id, tech_stack, error_signature, times_hit, is_demo FROM error_logs LIMIT 15');
    console.log('\n🐛 Error Logs (Child Table):');
    console.table(errors);

    const [summary] = await conn.query('SELECT * FROM v_domain_summary');
    console.log('\n📊 Domain Summary (View):');
    console.table(summary);

    await conn.end();
    console.log('\n✅ All database objects verified.');
  } catch (err) {
    console.error('❌ MySQL Inspection failed:', err.message);
  }
}

inspect();
