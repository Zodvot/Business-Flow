import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

type User = { id: string; email: string; username: string; picture: string; birthday: string | null; gender: string; role: string; approved: boolean; created_at: string; days: number };
type Member = Pick<User, 'id' | 'email' | 'username' | 'role' | 'approved'>;
type Details = Pick<User, 'picture' | 'gender'> & { birthday: string };
const blank = { picture: '', gender: '', birthday: '' };
const message = (error: unknown) => error instanceof Error ? error.message : 'Request failed.';

async function api(path: string, method = 'GET', body?: object) {
  const response = await fetch('/api/account/' + path, method === 'GET' ? {} : {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'Account service unavailable.'), { status: response.status });
  return data;
}

function ProfileFields({ details, change }: { details: Details; change: (next: Details) => void }) {
  const [error, setError] = useState('');
  return <>
    <label className="field">Birthday (optional)<input type="date" value={details.birthday} onChange={event => change({ ...details, birthday: event.target.value })} /></label>
    <label className="field">Gender (optional)<input maxLength={80} value={details.gender} onChange={event => change({ ...details, gender: event.target.value })} /></label>
    {details.picture && <img className="account-photo" alt="Profile preview" src={details.picture} />}
    <label className="field">Profile picture (PNG or JPEG, up to 512 KB)<input type="file" accept="image/png,image/jpeg" onChange={event => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 512 * 1024 || !['image/jpeg','image/png'].includes(file.type)) { setError('Choose a PNG or JPEG up to 512 KB.'); return; }
      const reader = new FileReader();
      reader.onload = () => { change({ ...details, picture: String(reader.result) }); setError(''); };
      reader.onerror = () => setError('Could not read the image.');
      reader.readAsDataURL(file);
    }} /></label>
    {details.picture && <button type="button" className="button outline" onClick={() => change({ ...details, picture: '' })}>Remove picture</button>}
    {error && <p role="alert">{error}</p>}
  </>;
}

function Login({ signedIn }: { signedIn: (user: User) => void }) {
  const [signup, setSignup] = useState(false);
  const [details, change] = useState<Details>(blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError('');
    try { signedIn(await api(signup ? 'signup' : 'login', 'POST', { ...values, ...details })); }
    catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  }
  return <main className="account-shell"><form key={String(signup)} className="panel account-panel" onSubmit={submit}>
    <p className="eyebrow">BusinessFlow</p><h1>{signup ? 'Create your account' : 'Sign in'}</h1>
    {signup ? <><label className="field">Email<input type="email" name="email" autoComplete="email" maxLength={254} required /></label>
      <label className="field">Username<input name="username" autoComplete="username" pattern="[A-Za-z0-9_\-]{3,32}" title="3–32 letters, numbers, hyphens or underscores" required /></label></> :
      <label className="field">Email or username<input name="login" autoComplete="username" required /></label>}
    <label className="field">{signup ? 'Password (at least 12 characters)' : 'Password'}<input type="password" name="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 12 : 1} maxLength={128} required /></label>
    {signup && <ProfileFields details={details} change={change} />}
    {error && <p role="alert">{error}</p>}
    <div className="account-actions"><button disabled={busy} className="button dark">{signup ? 'Create account' : 'Sign in'}</button>
    <button type="button" className="button outline" disabled={busy} onClick={() => { setSignup(!signup); setError(''); }}>{signup ? 'Back to sign in' : 'Sign up'}</button></div>
  </form></main>;
}

function Members() {
  const [users, setUsers] = useState<Member[]>([]);
  const [error, setError] = useState('');
  async function load() { try { setUsers(await api('admin/users')); setError(''); } catch (failure) { setError(message(failure)); } }
  useEffect(() => { void load(); }, []);
  async function update(member: Member, action: string) {
    if (action === 'promote' && !window.confirm('Grant admin access to ' + member.username + '?')) return;
    try { await api('admin/users/' + member.id + '/' + action, 'POST'); await load(); } catch (failure) { setError(message(failure)); }
  }
  return <section className="panel account-panel"><h2>Manage accounts</h2>{error && <p role="alert">{error}</p>}
    {users.map(member => <div className="member-row" key={member.id}><strong>{member.username}</strong> · {member.email} · {member.approved ? member.role : 'Awaiting approval'}
      <div className="account-actions">{!member.approved && <button className="button outline" onClick={() => update(member, 'approve')}>Approve</button>}
      {member.role !== 'admin' && <button className="button outline" onClick={() => update(member, 'promote')}>Make admin</button>}
      {member.approved && member.role === 'member' && <button className="button outline" onClick={() => update(member, 'revoke')}>Revoke workspace access</button>}</div>
    </div>)}</section>;
}

function PasswordForm() {
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  return <form className="panel account-panel" onSubmit={async event => {
    event.preventDefault();
    setBusy(true);
    try {
      await api('password', 'POST', Object.fromEntries(new FormData(event.currentTarget)));
      window.dispatchEvent(new Event('session-expired'));
    } catch (failure) { setNotice(message(failure)); } finally { setBusy(false); }
  }}><h2>Change password</h2>
    <p>Changing your password signs out all sessions.</p>
    <label className="field">Current password<input name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} /></label>
    <label className="field">New password<input name="newPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /></label>
    <button disabled={busy} className="button dark">Change password</button><p role="status">{notice}</p>
  </form>;
}

function Profile({ user, saved }: { user: User; saved: (account: User) => void }) {
  const [details, change] = useState<Details>({ picture: user.picture, birthday: user.birthday || '', gender: user.gender });
  const [notice, setNotice] = useState('');
  return <><form className="panel account-panel" onSubmit={async event => {
    event.preventDefault();
    try { saved(await api('me', 'PATCH', details)); setNotice('Profile saved.'); } catch (failure) { setNotice(message(failure)); }
  }}><h1>{user.username}</h1><p>{user.email}</p><p>User ID: {user.id}</p>
    <p>{user.role === 'admin' ? 'Administrator' : 'Member'} · Account age: {Math.floor((Date.now()-Date.parse(user.created_at))/86400000)} days</p>
    {!user.approved && <p>Your account is awaiting workspace approval. Refresh after an admin approves it.</p>}
    <ProfileFields details={details} change={change} /><button className="button dark">Save profile</button><p role="status">{notice}</p>
    </form><PasswordForm />{user.role === 'admin' && <Members />}</>;
}

export default function AccountGate({ children }: { children: (user: User) => ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const expired = () => { setUser(null); setProfile(false); setError(''); };
    window.addEventListener('session-expired', expired);
    api('me').then(setUser).catch(failure => { if (failure.status !== 401) setError(message(failure)); }).finally(() => setReady(true));
    return () => window.removeEventListener('session-expired', expired);
  }, []);
  if (!ready) return <p>Opening BusinessFlow…</p>;
  if (!user && error) return <main className="account-shell"><p role="alert">{error}</p><button onClick={() => location.reload()}>Retry</button></main>;
  if (!user) return <Login signedIn={setUser} />;
  return <><div className="account-bar">
    {user.picture && <img className="account-photo" src={user.picture} alt="" />}
    <strong>{user.username}</strong>
    {user.approved && <button className="button outline" onClick={() => setProfile(!profile)}>{profile ? 'Back to workspace' : 'My profile'}</button>}
    <button className="button outline" onClick={async () => {
      try { await api('logout', 'POST'); setUser(null); setProfile(false); setError(''); } catch (failure) { setError(message(failure)); }
    }}>Sign out</button>{error && <span role="alert">{error}</span>}
  </div>{profile || !user.approved ? <main className="account-shell"><Profile user={user} saved={setUser} /></main> : children(user)}</>;
}
