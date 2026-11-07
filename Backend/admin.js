const { pool } = require('./database');

async function promote() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error('Usage: node admin.js email@example.com');
  const result = await pool.query("UPDATE users SET role='admin', approved=true WHERE email=$1", [email]);
  if (!result.rowCount) throw new Error('Sign up with this email first.');
  console.log('Admin access granted.');
}

promote().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
