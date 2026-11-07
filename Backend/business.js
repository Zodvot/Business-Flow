const express = require('express');
const { randomUUID } = require('node:crypto');
const { pool } = require('./database');
const router = express.Router();
router.use(express.json({ limit: '16kb' }));
function nameOf(value) {
  return typeof value === 'string' && value.trim().length <= 120 ? value.trim() : '';
}
function validMoney(value) {
  return typeof value === 'string' && /^\d{1,10}(\.\d{1,2})?$/.test(value);
}

router.get('/products', async (request, response) => {
  const result = await pool.query('SELECT * FROM products ORDER BY name');
  response.json(result.rows);
});
router.post('/customers', async (request, response) => {
  const name = nameOf(request.body?.name);
  if (!name) return response.status(400).json({ error: 'Customer name is required (up to 120 characters).' });
  const result = await pool.query('INSERT INTO customers(id,name) VALUES($1,$2) RETURNING *', ['CUS-' + randomUUID(), name]);
  response.status(201).json(result.rows[0]);
});
router.patch('/customers/:id', async (request, response) => {
  const name = nameOf(request.body?.name);
  if (!name) return response.status(400).json({ error: 'Customer name is required (up to 120 characters).' });
  const result = await pool.query('UPDATE customers SET name=$1 WHERE id=$2 RETURNING *', [name, request.params.id]);
  if (!result.rowCount) return response.status(404).json({ error: 'Customer not found.' });
  response.json(result.rows[0]);
});
router.delete('/customers/:id', async (request, response) => {
  if (request.account.role !== 'admin') return response.status(403).json({ error: 'Admin access required.' });
  try {
    const result = await pool.query('DELETE FROM customers WHERE id=$1 RETURNING id', [request.params.id]);
    response.status(result.rowCount ? 200 : 404).json({ ok: Boolean(result.rowCount) });
  } catch (error) {
    if (error.code === '23503') return response.status(409).json({ error: 'Keep customers with invoice history. You can edit their name.' });
    throw error;
  }
});
router.post('/products', async (request, response) => {
  const name = nameOf(request.body?.name);
  const price = request.body?.price;
  if (!name || !validMoney(price)) return response.status(400).json({ error: 'Enter a name and a nonnegative price with up to two decimal places.' });
  try {
    const result = await pool.query('INSERT INTO products(id,name,price) VALUES($1,$2,$3) RETURNING *', ['PRD-' + randomUUID(), name, price]);
    response.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ error: 'A product with this name already exists.' });
    throw error;
  }
});
router.patch('/products/:id', async (request, response) => {
  const name = nameOf(request.body?.name);
  const price = request.body?.price;
  if (!name || !validMoney(price)) return response.status(400).json({ error: 'Enter a name and a nonnegative price with up to two decimal places.' });
  try {
    const result = await pool.query('UPDATE products SET name=$1,price=$2 WHERE id=$3 RETURNING *', [name, price, request.params.id]);
    if (!result.rowCount) return response.status(404).json({ error: 'Product not found.' });
    response.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ error: 'A product with this name already exists.' });
    throw error;
  }
});
router.post('/invoices', async (request, response) => {
  const { customerId, productId, date, requestId } = request.body || {};
  if (typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) ||
      typeof customerId !== 'string' || typeof productId !== 'string' ||
      typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date || date < '0001-01-01') {
    return response.status(400).json({ error: 'Choose a customer, product and valid invoice date.' });
  }
  const result = await pool.query(`
    INSERT INTO invoices(id,customer_id,product,issued_on,amount,status,request_id)
    SELECT $1,customers.id,products.name,$2,products.price,'Pending',$3
    FROM customers CROSS JOIN products WHERE customers.id=$4 AND products.id=$5
    ON CONFLICT(request_id) DO UPDATE SET request_id=excluded.request_id
    RETURNING *
  `, ['INV-' + randomUUID(), date, requestId, customerId, productId]);
  if (!result.rowCount) return response.status(400).json({ error: 'Customer or product no longer exists.' });
  response.status(201).json(result.rows[0]);
});
router.patch('/invoices/:id/status', async (request, response) => {
  if (!['Pending','Paid','Overdue'].includes(request.body?.status)) return response.status(400).json({ error: 'Invalid status.' });
  const result = await pool.query('UPDATE invoices SET status=$1 WHERE id=$2 RETURNING id,status', [request.body.status, request.params.id]);
  if (!result.rowCount) return response.status(404).json({ error: 'Invoice not found.' });
  response.json(result.rows[0]);
});
module.exports = router;
