const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pool } = require('./database');

module.exports = async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(73492001)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    for (const file of ['accounts.sql', 'business.sql']) {
      const applied = await client.query('SELECT name FROM schema_migrations WHERE name=$1', [file]);
      if (!applied.rowCount) {
        await client.query(readFileSync(join(__dirname, file), 'utf8'));
        await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [file]);
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
};
