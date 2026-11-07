const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pool } = require('./database');

async function setup() {
  const sql = readFileSync(join(__dirname, 'setup.sql'), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(readFileSync(join(__dirname, 'accounts.sql'), 'utf8'));
    const result = await client.query(
      'SELECT invoices.id, customers.name, amount, status FROM invoices JOIN customers ON customers.id = invoices.customer_id ORDER BY invoices.id DESC'
    );
    await client.query('COMMIT');
    console.table(result.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

setup().catch(error => {
  console.error('Setup failed:', error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
