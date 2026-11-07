import type { TransactionProps } from './DatabaseRows';
import { useState } from 'react';
import { money } from './businessData';

import { monthly } from './analytics';

export default function Assistant({ transactions }: TransactionProps) {
  const [question, setQuestion] = useState('');
  const periods = monthly(transactions);
  const overdue = transactions.filter(record => record.status === 'Overdue');
  const answers: Record<string, string> = {
    'Which invoices need follow-up?': overdue.map(record => record.id + ' · ' + record.name + ' · ' + money(Number(record.amount))).join('; ') || 'No overdue invoices.',
    'How does monthly billing compare?': money(periods[0].billed) + ' this month versus ' + money(periods[1].billed) + ' last month, grouped by invoice date.',
  };
  return <><div className="heading"><h1>Assistant</h1></div>
    <section className="panel"><h2>Ask about your workspace</h2><p>Choose a question for a rule-based summary calculated from saved invoices.</p>
      {Object.keys(answers).map(prompt => <button className="button outline prompt" key={prompt} onClick={() => setQuestion(prompt)}>{prompt}</button>)}
      <p aria-live="polite">{answers[question]}</p>
    </section></>;
}

