'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './password-field.module.css';

export function PasswordField({ id, label, minLength = 8, autoComplete = 'current-password' }: { id: string; label: string; minLength?: number; autoComplete?: 'current-password' | 'new-password' }) {
  const [visible, setVisible] = useState(false);
  return <><label htmlFor={id}>{label}</label><div className={styles.field}><input id={id} name={id} type={visible ? 'text' : 'password'} minLength={minLength} maxLength={128} autoComplete={autoComplete} required/><button type="button" aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible ? <EyeOff size={18} aria-hidden/> : <Eye size={18} aria-hidden/>}</button></div></>;
}
