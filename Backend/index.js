const express = require('express');
const { checkDatabase, pool } = require('./database');
const { router: accounts, session } = require('./accounts');

const app = express();
app.disable('x-powered-by');
app.use((request, response, next) => {
  response.set('X-Content-Type-Options', 'nosniff');
  if (request.path.startsWith('/api')) response.set('Cache-Control', 'no-store');
  const origin = request.headers.origin;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && origin) {
    try {
      if (new URL(origin).host !== request.headers.host) return response.status(403).json({ error: 'Cross-origin request blocked.' });
    } catch { return response.sendStatus(403); }
  }
  next();
});
const port = process.env.PORT || 3001;

app.get('/health', (request, response) => {
  response.json({ status: 'ok' });
});

app.get('/health/db', async (request, response) => {
  try {
    response.json({ status: 'ok', ...await checkDatabase() });
  } catch {
    response.status(503).json({ status: 'database unavailable' });
  }
});

app.use('/api/account', accounts);
app.use('/api', session, (request, response, next) => {
  if (!request.account.approved) return response.status(403).json({ error: 'Workspace approval required.' });
  next();
});

app.use('/api', require('./business'));

app.get('/api/customers', async (request, response) => {
  try {
    const { rows } = await pool.query(`
      SELECT customers.id, customers.name, count(invoices.id) AS invoices,
             coalesce(sum(invoices.amount), 0) AS billed
      FROM customers LEFT JOIN invoices ON invoices.customer_id = customers.id
      GROUP BY customers.id ORDER BY customers.name, customers.id
    `);
    response.json(rows);
  } catch {
    response.status(503).json({ error: 'Cannot load customers.' });
  }
});

app.get('/api/invoices', async (request, response) => {
  try {
    const { rows } = await pool.query(`
      SELECT invoices.id, customers.name, invoices.product, to_char(issued_on, 'YYYY-MM-DD') AS date, amount, status
      FROM invoices JOIN customers ON customers.id = invoices.customer_id
      ORDER BY issued_on DESC, invoices.id DESC
    `);
    response.json(rows);
  } catch {
    response.status(503).json({ error: 'Cannot load invoices.' });
  }
});

app.patch('/api/invoices/:id/paid', async (request, response) => {
  try {
    const { rows } = await pool.query(
      "UPDATE invoices SET status = 'Paid' WHERE id = $1 RETURNING id, status",
      [request.params.id]
    );
    if (!rows.length) return response.status(404).json({ error: 'Invoice not found.' });
    response.json(rows[0]);
  } catch {
    response.status(503).json({ error: 'Cannot update invoice.' });
  }
});

app.use((error, request, response, next) => {
  const status = error.status === 413 ? 413 : error.status === 400 ? 400 : 503;
  response.status(status).json({ error: status === 413 ? 'Image too large.' : status === 400 ? 'Invalid request.' : 'Service unavailable. Check database setup.' });
});

app.use('/api', (request, response) => response.status(404).json({ error: 'Unknown API route.' }));
app.use(express.static(require('node:path').join(__dirname, '../Frontend/dist')));

require('./migrate')().then(() => {
  app.listen(port, '127.0.0.1', () => {
    console.log('BusinessFlow is ready at http://127.0.0.1:' + port);
  });
}).catch(error => {
  console.error('Startup failed. Check PostgreSQL credentials and run setup.js for a new database.', error.message);
  process.exitCode = 1;
  pool.end();
});
