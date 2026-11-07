import { useState } from 'react';

export default function Settings({ name, onSave }: { name: string; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(name);
  const [message, setMessage] = useState('');
  return <><div className="heading"><h1>Settings</h1></div>
    <form className="panel" onSubmit={event => {
      event.preventDefault();
      if (!draft.trim()) return;
      try {
        localStorage.setItem('businessflow.workspace', draft.trim());
        onSave(draft.trim());
        setMessage('Workspace name saved on this browser.');
      } catch { setMessage('Browser storage unavailable. Your change could not be saved.'); }
    }}>
      <label className="field">Workspace name<input required maxLength={40} value={draft} onChange={event => {setDraft(event.target.value); setMessage('');}} /></label>
      <button className="button dark" disabled={!draft.trim()}>Save changes</button><p role="status">{message}</p>
    </form></>;
}
