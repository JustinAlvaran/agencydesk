'use client';
import { useEffect, useState, useTransition } from 'react';
import { signIn, signInWithProvider } from '@/app/login/actions';

export function useWorkspaceLogin() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  useEffect(() => { setError(new URLSearchParams(window.location.search).get('error')?.slice(0,250) ?? ''); }, []);
  function login(email: string, password: string) {
    setError('');
    startTransition(async () => {
      const form = new FormData(); form.set('email', email); form.set('password', password);
      const result = await signIn(form); setError(result.error);
    });
  }
  function oauth(provider: 'Google' | 'GitHub') {
    setError('');
    startTransition(async () => { const result = await signInWithProvider(provider === 'Google' ? 'google' : 'github'); setError(result.error); });
  }
  return { pending, error, login, oauth };
}
