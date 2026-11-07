import { useEffect, useState, type FormEvent } from 'react';
import Directory from './Directory';
import { money } from './businessData';
import { request, errorMessage } from './api';

type Record = { id: string; name: string; price?: string; invoices?: string; billed?: string };

export default function Catalog({ kind, admin }: { kind: 'customers' | 'products'; admin?: boolean }) {
  const [records, setRecords] = useState<Record[]>([]);
  const [editing, setEditing] = useState<Record | null>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const products = kind === 'products';
  async function load() {
    try { setRecords(await request(kind)); setReady(true); setError(''); }
    catch (failure) { setError(errorMessage(failure)); }
  }
  useEffect(() => { void load(); }, [kind]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || busy) return;
    setBusy(true);
    try {
      await request(kind + (editing.id ? '/' + encodeURIComponent(editing.id) : ''), editing.id ? 'PATCH' : 'POST', editing);
      setEditing(null); await load();
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  return <>
    <div className="account-actions"><button className="button dark" onClick={() => { setEditing({ id: '', name: '', price: '0.00' }); setError(''); }}>Add {products ? 'product' : 'customer'}</button>
    <button className="button outline" onClick={load}>Refresh</button></div>
    {error && <p role="alert">{error}</p>}
    {editing && <form className="panel editor-form" onSubmit={save}><h2>{editing.id ? 'Edit' : 'New'} {products ? 'product' : 'customer'}</h2>
      <label className="field">Name<input required maxLength={120} autoFocus value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} /></label>
      {products && <label className="field">Price (USD)<input required type="number" min="0" max="9999999999.99" step=".01" value={editing.price} onChange={event => setEditing({ ...editing, price: event.target.value })} /></label>}
      <div className="account-actions"><button className="button dark" disabled={busy || !editing.name.trim()}>Save</button><button type="button" className="button outline" disabled={busy} onClick={() => setEditing(null)}>Cancel</button></div>
    </form>}
    {ready ? <Directory title={products ? 'Products' : 'Customers'} columns={products ? ['ID','Name','Price'] : ['ID','Name','Invoices','Total billed']}
      rows={records.map(record => products ? [record.id,record.name,money(Number(record.price))] : [record.id,record.name,record.invoices || '0',money(Number(record.billed))])}
      action={([id]) => <div className="account-actions"><button className="button outline" onClick={() => setEditing(records.find(record => record.id === id) || null)}>Edit</button>
        {admin && !products && <button className="button outline" disabled={busy} onClick={async () => {
          if (!window.confirm('Delete this customer? Customers with invoices are kept.')) return;
          setBusy(true);
          try { await request(kind + '/' + encodeURIComponent(id), 'DELETE'); await load(); }
          catch (failure) { setError(errorMessage(failure)); } finally { setBusy(false); }
        }}>Delete</button>}</div>} /> : <p>Loading…</p>}
  </>;
}
