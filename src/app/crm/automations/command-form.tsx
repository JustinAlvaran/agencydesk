'use client';
import { useState, type ReactNode } from 'react';
import type { CommandResult } from './actions';

export function CommandForm({ action, children }: { action: (form: FormData) => Promise<CommandResult>; children: ReactNode }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CommandResult | null>(null);
  async function submit(form: FormData) {
    setPending(true); setResult(null);
    try { setResult(await action(form)); }
    catch { setResult({ ok: false, message: 'Could not save. Check your permissions, required fields, and the current job state.' }); }
    finally { setPending(false); }
  }
  return <form action={submit}><fieldset className="command-fields" disabled={pending}>{children}</fieldset><p role="status" aria-live="polite" className={result?.ok === false ? 'error-text' : 'muted'}>{pending ? 'Working…' : result?.message}</p></form>;
}
