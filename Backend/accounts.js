const express = require('express');
const { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const { rateLimit } = require('express-rate-limit');
const { pool } = require('./database');

const router = express.Router();
const derive = promisify(scrypt);
const sessionAge = 7 * 86400000;
const cookie = { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' };
const fields = "users.id, email, username, picture, to_char(birthday,'YYYY-MM-DD') AS birthday, gender, role, approved, created_at, floor(extract(epoch from now()-created_at)/86400)::int AS days";
const limit = rateLimit({ windowMs: 15 * 60000, limit: 30, skipSuccessfulRequests: true, message: { error: 'Too many attempts. Try again later.' } });
const hash = token => createHash('sha256').update(token).digest('hex');
const tokenOf = request => /(?:^|;\s*)bf_session=([a-f0-9]{64})(?:;|$)/.exec(request.headers.cookie || '')?.[1];
const text = value => typeof value === 'string' ? value.trim() : '';

function profile(body) {
  const { picture = '', birthday = '', gender = '' } = body;
  if (typeof picture !== 'string' || (picture && !/^data:image\/(png;base64,iVBORw0KGgo|jpeg;base64,\/9j\/)[A-Za-z0-9+/=]+$/.test(picture)) || picture.length > 700000)
    throw new Error('Choose a PNG or JPEG under 512 KB.');
  if (birthday && (typeof birthday !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthday) || !Number.isFinite(Date.parse(birthday)) || new Date(birthday).toISOString().slice(0,10) !== birthday || birthday > new Date().toISOString().slice(0,10) || birthday < '0001-01-01'))
    throw new Error('Enter a valid birthday in the past or today.');
  if (typeof gender !== 'string' || gender.length > 80) throw new Error('Gender must be 80 characters or fewer.');
  return [picture, birthday || null, gender.trim()];
}

async function session(request, response, next) {
  const token = tokenOf(request);
  if (token) {
    const result = await pool.query('SELECT ' + fields + ' FROM users JOIN sessions ON users.id=sessions.user_id WHERE token_hash=$1 AND expires_at>now()', [hash(token)]);
    request.account = result.rows[0];
  }
  if (!request.account) return response.status(401).json({ error: 'Sign in to continue.' });
  next();
}

async function issue(userId, response) {
  const token = randomBytes(32).toString('hex');
  await pool.query("DELETE FROM sessions WHERE expires_at <= now()");
  await pool.query("INSERT INTO sessions VALUES ($1,$2,now()+interval '7 days')", [hash(token), userId]);
  response.cookie('bf_session', token, { ...cookie, maxAge: sessionAge });
}

router.use((request, response, next) => {
  response.set('Cache-Control', 'no-store');
  if (!['GET','HEAD','OPTIONS'].includes(request.method) && !request.is('application/json'))
    return response.status(415).json({ error: 'Expected a JSON request.' });
  next();
});
router.use(express.json({ limit: '750kb' }));
router.post('/signup', limit, async (request, response) => {
  const body = request.body || {};
  const email = text(body.email).toLowerCase();
  const username = text(body.username);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !/^[a-zA-Z0-9_-]{3,32}$/.test(username))
    return response.status(400).json({ error: 'Enter a valid email and a 3–32 character username (letters, numbers, hyphens or underscores).' });
  if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128)
    return response.status(400).json({ error: 'Choose a password of 12–128 characters.' });
  let details;
  try { details = profile(body); } catch (error) { return response.status(400).json({ error: error.message }); }
  const salt = randomBytes(16).toString('hex');
  const digest = await derive(body.password, salt, 64, { N: 32768, maxmem: 64*1024*1024 });
  try {
    const result = await pool.query('INSERT INTO users(id,email,username,password_hash,picture,birthday,gender) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING ' + fields,
      [randomUUID(), email, username, salt + ':' + digest.toString('hex'), ...details]);
    await issue(result.rows[0].id, response);
    response.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ error: 'Email or username is already in use.' });
    throw error;
  }
});
router.post('/login', limit, async (request, response) => {
  const { login, password } = request.body || {};
  if (typeof password !== 'string' || password.length > 128) return response.status(400).json({ error: 'Invalid credentials.' });
  const { rows } = await pool.query('SELECT password_hash,' + fields + ' FROM users WHERE email=$1 OR lower(username)=$1', [text(login).toLowerCase()]);
  const account = rows[0];
  const [salt, stored] = (account?.password_hash || '00000000000000000000000000000000:' + '00'.repeat(64)).split(':');
  const digest = await derive(password, salt, 64, { N: 32768, maxmem: 64*1024*1024 });
  if (!timingSafeEqual(digest, Buffer.from(stored, 'hex')) || !account) return response.status(401).json({ error: 'Incorrect username/email or password.' });
  delete account.password_hash;
  await issue(account.id, response);
  response.json(account);
});
router.post('/logout', async (request, response) => {
  const token = tokenOf(request);
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash=$1', [hash(token)]);
  response.clearCookie('bf_session', cookie).json({ ok: true });
});
router.use(session);
router.get('/me', (request, response) => response.json(request.account));
router.post('/password', limit, async (request, response) => {
  const { currentPassword, newPassword } = request.body || {};
  if (typeof currentPassword !== 'string' || currentPassword.length > 128 ||
      typeof newPassword !== 'string' || newPassword.length < 12 || newPassword.length > 128) {
    return response.status(400).json({ error: 'Use a new password of 12–128 characters.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('SELECT password_hash FROM users WHERE id=$1 FOR UPDATE', [request.account.id]);
    const [salt, stored] = result.rows[0].password_hash.split(':');
    const digest = await derive(currentPassword, salt, 64, { N: 32768, maxmem: 64*1024*1024 });
    if (!timingSafeEqual(digest, Buffer.from(stored, 'hex'))) {
      await client.query('ROLLBACK');
      return response.status(400).json({ error: 'Current password is incorrect.' });
    }
    const nextSalt = randomBytes(16).toString('hex');
    const nextHash = await derive(newPassword, nextSalt, 64, { N: 32768, maxmem: 64*1024*1024 });
    await client.query('UPDATE users SET password_hash=$1 WHERE id=$2', [nextSalt + ':' + nextHash.toString('hex'), request.account.id]);
    await client.query('DELETE FROM sessions WHERE user_id=$1', [request.account.id]);
    await client.query('COMMIT');
    response.clearCookie('bf_session', cookie).json({ ok: true });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
});
router.patch('/me', async (request, response) => {
  let details;
  try { details = profile(request.body || {}); } catch (error) { return response.status(400).json({ error: error.message }); }
  const result = await pool.query('UPDATE users SET picture=$1,birthday=$2,gender=$3 WHERE id=$4 RETURNING ' + fields, [...details, request.account.id]);
  response.json(result.rows[0]);
});
router.use('/admin', (request, response, next) => request.account.role === 'admin' ? next() : response.status(403).json({ error: 'Admin access required.' }));
router.get('/admin/users', async (request, response) => {
  const { rows } = await pool.query('SELECT id,username,email,role,approved FROM users ORDER BY created_at');
  response.json(rows);
});
router.post('/admin/users/:id/:action', async (request, response) => {
  const action = request.params.action;
  if (action === 'revoke') {
    const { rowCount } = await pool.query("UPDATE users SET approved=false WHERE id::text=$1 AND role='member'", [request.params.id]);
    return response.status(rowCount ? 200 : 409).json(rowCount ? { ok: true } : { error: 'Only member workspace access can be revoked.' });
  }
  if (!['approve','promote'].includes(action)) return response.sendStatus(404);
  const { rowCount } = await pool.query("UPDATE users SET approved=true,role=CASE WHEN $1='promote' THEN 'admin' ELSE role END WHERE id::text=$2", [action, request.params.id]);
  response.status(rowCount ? 200 : 404).json({ ok: Boolean(rowCount) });
});
module.exports = { router, session };
