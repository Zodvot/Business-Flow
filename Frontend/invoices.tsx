import InvoiceForm from './invoiceForm';
import { request, errorMessage } from './api';
import Directory from './Directory';
import { useEffect, useState } from 'react';
import { money } from './businessData';

type Invoice = { id: string; name: string; date: string; amount: string; status: string };

export default function Invoices() {
  const [creating, setCreating] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setError('');
      try {
        const response = await fetch('/api/invoices', { signal: controller.signal });
        if (response.status === 401) window.dispatchEvent(new Event('session-expired'));
        if (!response.ok) throw new Error();
        setInvoices(await response.json());
      } catch {
        if (!controller.signal.aborted) setError('Could not load invoices. Check the backend connection and retry.');
      }
    }
    load();
    return () => controller.abort();
  }, [attempt]);

  async function setStatus(id: string, status: string) {
    setSaving(id);
    setError('');
    try {
      const updated = await request('invoices/' + encodeURIComponent(id) + '/status', 'PATCH', { status });
      setInvoices(current => current?.map(record => record.id === id ? { ...record, status: updated.status } : record) ?? null);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSaving('');
    }
  }

  if (!invoices) return <><h1>Invoices</h1>{error ? <><p role="alert">{error}</p><button onClick={() => setAttempt(attempt + 1)}>Retry</button></> : <p>Loading invoices…</p>}</>;
  const rows = invoices.map(record => [record.id, record.name, record.date, money(Number(record.amount)), record.status]);
  return <><button className="button dark" onClick={() => setCreating(true)}>New invoice</button>
    {creating && <InvoiceForm cancel={() => setCreating(false)} saved={() => { setCreating(false); setAttempt(attempt + 1); }} />}
    {error && <p role="alert">{error}</p>}
    <Directory title="Invoices" columns={['Invoice', 'Customer', 'Date', 'Amount', 'Status']} rows={rows}
      action={([id, , , , status]) => <select aria-label={'Status for ' + id} value={status} disabled={Boolean(saving)} onChange={event => setStatus(id, event.target.value)}>
        <option>Pending</option><option>Paid</option><option>Overdue</option>
      </select>} />
  </>;
}

