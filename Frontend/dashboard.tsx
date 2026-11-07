import { useState } from 'react';
import type { TransactionProps } from './DatabaseRows';
import { monthly, exportInvoices } from './analytics';
import { money } from './businessData';
import Directory from './Directory';

export default function Dashboard({ transactions }: TransactionProps) {
  const [period, setPeriod] = useState('This month');
  const data = monthly(transactions).find(item => item.label === period)!;
  const records = transactions.filter(record => record.date.startsWith(data.key));
  return <>
    <div className="heading"><div><p className="eyebrow">THE BIG PICTURE</p><h1>Business overview</h1><p>Live invoice totals for {data.key}</p></div>
      <select aria-label="Reporting period" value={period} onChange={event => setPeriod(event.target.value)}><option>This month</option><option>Last month</option></select></div>
    <section className="stats">{[{label:'Total billed',value:money(data.billed)},{label:'Paid invoices',value:money(data.paid)},{label:'Outstanding',value:money(data.outstanding)},{label:'Invoices',value:String(data.count)}].map(metric =>
      <article className="panel stat" key={metric.label}><div>{metric.label}</div><strong>{metric.value}</strong><small>{period}</small></article>)}</section>
    <section className="panel"><h2>Payment progress</h2><progress aria-label="Paid portion of monthly billed amount" value={data.paid} max={data.billed || 1} />
      <p>{money(data.paid)} paid out of {money(data.billed)} billed for this invoice month.</p>
      <p>{transactions.filter(record => record.status === 'Pending').length} pending · {transactions.filter(record => record.status === 'Overdue').length} overdue across all invoices</p>
    </section>
    <button className="button outline export-button" onClick={() => exportInvoices(records)}>Export selected month</button>
    <Directory title="Monthly transactions" columns={['Invoice','Customer','Date','Amount','Status']} rows={records.map(record => [record.id,record.name,record.date,money(Number(record.amount)),record.status])} />
  </>;
}
