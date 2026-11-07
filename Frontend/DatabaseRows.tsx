import { useEffect, useState, type ReactNode } from 'react';

export type Transaction = { id: string; name: string; product: string; date: string; amount: string; status: string };
export type TransactionProps = { transactions: Transaction[] };

export default function DatabaseRows<Row>({ path, children }: { path: string; children: (rows: Row[]) => ReactNode }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setError(false);
      try {
        const response = await fetch(path, { signal: controller.signal });
        if (response.status === 401) window.dispatchEvent(new Event('session-expired'));
        if (!response.ok) throw new Error();
        setRows(await response.json());
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    load();
    return () => controller.abort();
  }, [path, attempt]);
  if (error) return <p role="alert">Could not load records. <button onClick={() => setAttempt(attempt + 1)}>Retry</button></p>;
  return rows ? children(rows) : <p>Loading records…</p>;
}
