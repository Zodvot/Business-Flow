import type { Transaction } from './DatabaseRows';

export function monthly(transactions: Transaction[]) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Beirut', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const [year, month] = today.split('-').map(Number);
  const previous = new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0,7);
  return ['This month','Last month'].map((label, index) => {
    const key = index === 0 ? today.slice(0,7) : previous;
    const invoices = transactions.filter(record => record.date.startsWith(key));
    const billedCents = invoices.reduce((sum, record) => sum + Math.round(Number(record.amount) * 100), 0);
    const paidCents = invoices.filter(record => record.status === 'Paid').reduce((sum, record) => sum + Math.round(Number(record.amount) * 100), 0);
    return { label, key, count: invoices.length, billed: billedCents/100, paid: paidCents/100, outstanding: (billedCents-paidCents)/100 };
  });
}
export function exportInvoices(transactions: Transaction[]) {
  const rows = [['Invoice','Customer','Product','Date','Amount','Status'], ...transactions.map(record => [record.id,record.name,record.product,record.date,String(record.amount),record.status])];
  const content = rows.map(row => row.map(value => {
    const safe = /^[=+@\-\t\r]/.test(value) ? "'" + value : value;
    return '"' + safe.replaceAll('"','""') + '"';
  }).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'businessflow-invoices.csv'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
