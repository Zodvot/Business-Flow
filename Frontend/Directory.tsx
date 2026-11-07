import { useState } from 'react';

import type { ReactNode } from 'react';

type DirectoryProps = {
  title: string;
  columns: string[];
  rows: string[][];
  action?: (row: string[]) => ReactNode;
};

export default function Directory({ title, columns, rows, action }: DirectoryProps) {
  const [query, setQuery] = useState('');
  const matches = rows.filter(row => row.some(cell => cell.toLowerCase().includes(query.trim().toLowerCase())));
  return <>
    <div className="heading"><h1>{title}</h1></div>
    <section className="panel">
      <label className="field">Search {title.toLowerCase()}
        <input value={query} onChange={event => setQuery(event.target.value)} />
      </label>
      <div className="table-scroll"><table>
        <thead><tr>{columns.map(column => <th key={column}>{column}</th>)}{action && <th>Action</th>}</tr></thead>
        <tbody>{matches.map(row => <tr key={row[0]}>{row.map((cell, index) => <td key={columns[index]}>{cell}</td>)}{action && <td>{action(row)}</td>}</tr>)}</tbody>
      </table></div>
      {matches.length === 0 && <p>No matching records.</p>}
    </section>
  </>;
}
