const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  database: process.env.PGDATABASE || 'businessflow',
  user: process.env.PGUSER || 'postgres',
  connectionTimeoutMillis: 3000,
});

async function checkDatabase() {
  const result = await pool.query('SELECT current_database() AS database');
  return result.rows[0];
}

module.exports = { checkDatabase, pool };

if (require.main === module) {
  checkDatabase()
    .then(({ database }) => console.log('Connected to ' + database))
    .catch(error => {
      console.error('Database check failed:', error.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
