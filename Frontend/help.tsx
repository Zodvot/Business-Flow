export default function Help() {
  return <><h1>Help</h1><section className="panel">
    <details><summary>How do I create an invoice?</summary><p>Add a customer and a product first, then choose New invoice. The catalog price and product name are saved on the invoice as a historical snapshot.</p></details>
    <details><summary>How do payments work?</summary><p>Choose Paid to record a payment already received. Status changes save to PostgreSQL. Pending and Overdue count as outstanding.</p></details>
    <details><summary>How are totals calculated?</summary><p>Dashboard and Reports group invoices by issue month using the Beirut calendar. Paid totals use current invoice status, rather than the date money was received. All amounts are USD.</p></details>
    <details><summary>Who can access this workspace?</summary><p>Approved members share customers, products and invoices. Administrators approve access and can remove customers that have no invoices. My profile contains personal details and account controls.</p></details>
    <details><summary>How do I export data?</summary><p>Reports exports all invoices. Dashboard exports the selected month. Refresh or reopen a page to see changes made in pgAdmin.</p></details>
    <details><summary>What does Assistant do?</summary><p>It calculates preset summaries from saved invoices. It uses local rules and requires no external AI service.</p></details>
  </section></>;
}
