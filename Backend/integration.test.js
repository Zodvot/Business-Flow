const assert = require('node:assert/strict');
const { pool } = require('./database');
if (process.env.TEST_DATABASE !== '1' || !process.env.TEST_API_URL) throw new Error('Disposable test environment required.');
const base = process.env.TEST_API_URL;
let cookie = '';
const suffix = Date.now();
async function call(path, method = 'GET', body, status = 200) {
  const response = await fetch(base + '/api/' + path, {
    method, headers: { cookie, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value = await response.json();
  assert.equal(response.status, status, JSON.stringify(value));
  if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
  return value;
}
async function run() {
  const account = { email: 'admin' + suffix + '@example.test', username: 'admin' + suffix, password: 'test-password-123' };
  await call('invoices', 'GET', undefined, 401);
  const admin = await call('account/signup', 'POST', { ...account, role: 'admin' }, 201);
  assert.equal(admin.role, 'member');
  await call('invoices', 'GET', undefined, 403);
  await call('account/admin/users', 'GET', undefined, 403);
  await pool.query("UPDATE users SET role='admin',approved=true WHERE id=$1", [admin.id]);
  const adminCookie = cookie;
  await call('account/me', 'PATCH', { birthday: '2025-02-30' }, 400);
  const profile = await call('account/me', 'PATCH', { birthday: '2000-02-29', gender: 'Prefer not to say' });
  assert.equal(profile.birthday, '2000-02-29');
  await call('account/signup', 'POST', account, 409);
  const second = await call('account/signup', 'POST', { ...account, email: 'member' + suffix + '@example.test', username: 'member' + suffix }, 201);
  const memberCookie = cookie;
  cookie = adminCookie;
  await call('account/admin/users/' + second.id + '/approve', 'POST', {});
  const customer = await call('customers', 'POST', { name: 'Test customer' }, 201);
  await call('customers/' + customer.id, 'PATCH', { name: ' ' }, 400);
  const updated = await call('customers/' + customer.id, 'PATCH', { name: 'Updated customer' });
  assert.equal(updated.name, 'Updated customer');
  await call('products', 'POST', { name: 'Bad price', price: '-3' }, 400);
  await call('products', 'POST', { name: 'Precision', price: '1.001' }, 400);
  const product = await call('products', 'POST', { name: 'Test product ' + suffix, price: '12.34' }, 201);
  const body = { customerId: customer.id, productId: product.id, date: '2026-11-07', requestId: require('node:crypto').randomUUID() };
  const invoice = await call('invoices', 'POST', body, 201);
  const retry = await call('invoices', 'POST', body, 201);
  assert.equal(invoice.id, retry.id);
  await call('invoices', 'POST', { ...body, date: '2026-02-30' }, 400);
  await call('products/' + product.id, 'PATCH', { name: product.name + ' revised', price: '99.00' });
  const records = await call('invoices');
  const snapshot = records.find(record => record.id === invoice.id);
  assert.equal(snapshot.amount, '12.34');
  assert.equal(snapshot.name, 'Updated customer');
  await call('invoices/' + invoice.id + '/status', 'PATCH', { status: 'Paid' });
  const saved = await pool.query('SELECT status FROM invoices WHERE id=$1', [invoice.id]);
  assert.equal(saved.rows[0].status, 'Paid');
  await call('customers/' + customer.id, 'DELETE', {}, 409);
  cookie = memberCookie;
  await call('customers');
  await call('customers/' + customer.id, 'DELETE', {}, 403);
  await call('account/admin/users', 'GET', undefined, 403);
  cookie = adminCookie;
  await call('account/admin/users/' + second.id + '/revoke', 'POST', {});
  cookie = memberCookie;
  await call('customers', 'GET', undefined, 403);
  cookie = adminCookie;
  await call('account/password', 'POST', { currentPassword: 'wrong', newPassword: 'new-password-456' }, 400);
  await call('account/password', 'POST', { currentPassword: account.password, newPassword: 'new-password-456' });
  cookie = adminCookie;
  await call('account/me', 'GET', undefined, 401);
  await call('account/login', 'POST', { login: account.email, password: account.password }, 401);
  await call('account/login', 'POST', { login: account.username, password: 'new-password-456' });
  await call('account/logout', 'POST', {});
  await call('account/me', 'GET', undefined, 401);
  console.log('PASS: authentication, roles, validation, profiles, password changes, customer/catalog editing, invoice retries, historical prices, payment persistence, and access revocation.');
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => pool.end());

