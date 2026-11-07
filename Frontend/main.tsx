import DatabaseRows, { type Transaction } from './DatabaseRows';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './home';
import AccountGate from './accounts';
import Dashboard from './dashboard';
import Customers from './customers';
import Products from './products';
import Invoices from './invoices';
import Reports from './reports';
import Settings from './settings';
import Assistant from './aiassistant';
import Help from './help';
// @ts-ignore CSS is loaded by the bundler; TypeScript has no declaration for this import.
import './styles.css';
// @ts-ignore CSS is loaded by the bundler; TypeScript has no declaration for this import.
import './workspace.css';

const navigation = { Home: '⌂', Dashboard: '▦', Customers: '👥', Products: '▧', Invoices: '▤', Reports: '▥', Assistant: '✧', Settings: '⚙', Help: '?' } as const;
type Page = keyof typeof navigation;
const pages = Object.keys(navigation) as Page[];

function App({ role }: { role: string }) {
  const [page, setPage] = useState<Page>('Home');
  const [name, setName] = useState(() => {
    try { return localStorage.getItem('businessflow.workspace') || 'Your workspace'; }
    catch { return 'Your workspace'; }
  });
  const screens = {
    Home: <DatabaseRows<Transaction> key="Home" path="/api/invoices">{transactions => <Home transactions={transactions} onOpenDashboard={() => setPage('Dashboard')} />}</DatabaseRows>, Dashboard: <DatabaseRows<Transaction> key="Dashboard" path="/api/invoices">{transactions => <Dashboard transactions={transactions} />}</DatabaseRows>,
    Customers: <Customers admin={role === 'admin'} />, Products: <Products />, Invoices: <Invoices />, Reports: <DatabaseRows<Transaction> key="Reports" path="/api/invoices">{transactions => <Reports transactions={transactions} />}</DatabaseRows>,
    Assistant: <DatabaseRows<Transaction> key="Assistant" path="/api/invoices">{transactions => <Assistant transactions={transactions} />}</DatabaseRows>, Settings: <Settings name={name} onSave={setName} />, Help: <Help />,
  };
  return <div className="app"><aside><a className="brand" href="#" onClick={() => setPage('Home')}><b>B</b> BusinessFlow<span>.</span></a><p className="eyebrow menu-label">WORKSPACE</p><nav aria-label="Main navigation">
    {pages.map(item => <button key={item} className={page === item ? 'active' : ''} aria-current={page === item ? 'page' : undefined} onClick={() => setPage(item)}>
      {navigation[item]} <span>{item}</span>
    </button>)}
  </nav><div className="sidebar-note"><span>✧</span><h3>Room to grow.</h3><p>Your business, a little more organized every day.</p></div><div className="profile"><b>YO</b><div>{name}<small>{role === 'admin' ? 'Administrator' : 'Workspace member'}</small></div></div></aside><div className="workspace"><header><span>Workspace <span className="muted"> / {page}</span></span><span className="demo">● Shared workspace</span></header><main>{screens[page]}</main><footer>BusinessFlow · A clearer view of your business.<span>USD · PostgreSQL</span></footer></div></div>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><AccountGate>{user => <App role={user.role} />}</AccountGate></StrictMode>);

