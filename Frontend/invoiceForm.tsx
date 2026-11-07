import { useEffect, useRef, useState, type FormEvent } from 'react';
import { request, errorMessage } from './api';
import { money } from './businessData';

type Choice = { id: string; name: string; price?: string };
export default function InvoiceForm({ saved, cancel }: { saved: () => void; cancel: () => void }) {
  const [customers, setCustomers] = useState<Choice[]>([]);
  const [products, setProducts] = useState<Choice[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const requestId = useRef(crypto.randomUUID());
  useEffect(() => {
    Promise.all([request('customers'), request('products')]).then(([people, catalog]) => {
      setCustomers(people); setProducts(catalog);
    }).catch(failure => setError(errorMessage(failure)));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try { await request('invoices', 'POST', { ...Object.fromEntries(new FormData(event.currentTarget)), requestId: requestId.current }); saved(); }
    catch (failure) { setError(errorMessage(failure)); } finally { setBusy(false); }
  }
  return <form className="panel editor-form" onSubmit={submit}><h2>New invoice</h2>
    <label className="field">Customer<select name="customerId" required defaultValue=""><option value="" disabled>Select customer</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
    <label className="field">Product or service<select name="productId" required defaultValue=""><option value="" disabled>Select product</option>{products.map(product => <option key={product.id} value={product.id}>{product.name} — {money(Number(product.price))}</option>)}</select></label>
    <label className="field">Invoice date<input name="date" type="date" defaultValue={new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Beirut' }).format(new Date())} required /></label>
    <p>The invoice saves the current catalog price and starts as Pending.</p>
    {error && <p role="alert">{error}</p>}
    <div className="account-actions"><button className="button dark" disabled={busy || !products.length || !customers.length}>Create invoice</button><button type="button" className="button outline" onClick={cancel} disabled={busy}>Cancel</button></div>
  </form>;
}
