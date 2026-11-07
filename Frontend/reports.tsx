import type { TransactionProps } from './DatabaseRows';
import { monthly, exportInvoices } from './analytics';
import { money } from './businessData';

export default function Reports({ transactions }: TransactionProps) {
  return <><div className="heading"><h1>Reports</h1><button className="button outline" onClick={() => exportInvoices(transactions)}>Export all invoices</button></div>
    <section className="panel"><h2>Monthly invoice performance</h2><p>Grouped by invoice date in the Beirut calendar. Paid totals reflect current invoice status.</p>
    <div className="table-scroll"><table><thead><tr><th>Month</th><th>Invoices</th><th>Billed</th><th>Paid</th><th>Outstanding</th></tr></thead>
    <tbody>{monthly(transactions).map(period => <tr key={period.key}><td>{period.key}</td><td>{period.count}</td><td>{money(period.billed)}</td><td>{money(period.paid)}</td><td>{money(period.outstanding)}</td></tr>)}</tbody></table></div></section></>;
}
