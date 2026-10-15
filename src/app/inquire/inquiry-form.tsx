'use client';
import { useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { inquirySchema } from '@/lib/validation';
import { undecidedService } from '@/lib/service-catalog';
const schema = inquirySchema.omit({ budget_cents: true }).extend({ budget: z.string().refine(value => Number.isFinite(Number(value)) && Number(value) >= 100 && Number(value) <= 1000000, 'Enter a budget between $100 and $1,000,000') }).refine(value => !value.whatsapp_opt_in || !!value.phone, { path: ['phone'], message: 'Add your phone number to request WhatsApp updates.' });
type Values = z.infer<typeof schema>;
export function InquiryForm({ available, services, initialService, intakeSource = 'website' }: { available: boolean; services: Array<{id:string;title:string}>; initialService: string; intakeSource?:'website'|'website_chatbot' }) {
  const fieldId = useId();
  const submission = useRef<{ body:string; id:string } | null>(null);
  const [result, setResult] = useState<{ success?: boolean; message: string } | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { service: initialService, website: '', phone: '', email_opt_in: false, whatsapp_opt_in: false } });
  async function submit(values: Values) {
    setResult(null);
    try {
      const payload = { ...values, budget_cents: Math.round(Number(values.budget) * 100), intake_source: intakeSource };
      const body = JSON.stringify(payload);
      if (submission.current?.body !== body) submission.current = { body, id: crypto.randomUUID() };
      const response = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, submission_id: submission.current.id }) });
      const data = await response.json();
      setResult({ success: response.ok, message: response.ok ? 'Your inquiry has been saved. Our team will review your project brief.' : data.error ?? 'Please try again.' });
    } catch { setResult({ message: 'Could not connect. Please try again.' }); }
  }
  const field = (name: 'contact_name' | 'email' | 'budget' | 'phone', label: string, type = 'text') => <label className="field inquiry-field">{label}<input {...register(name)} type={type} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${fieldId}-${name}-error` : undefined}/>{errors[name] && <small id={`${fieldId}-${name}-error`} role="alert">{errors[name]?.message}</small>}</label>;
  return <>
    {!available && <p role="status" className="demo-banner">This is a read-only portfolio demo. Inquiry submissions are unavailable.</p>}
    {result?.success ? <p role="status">{result.message}</p> : <form onSubmit={event => { void handleSubmit(submit)(event); }} noValidate><fieldset className="command-fields" disabled={!available || isSubmitting}>
      {field('contact_name','Your name')}{field('email','Email address','email')}{field('phone','Phone with country code (optional)','tel')}
      <label className="field inquiry-field">Service<select {...register('service')} aria-invalid={!!errors.service} aria-describedby={errors.service?`${fieldId}-service-error`:undefined}><option value="" disabled>Select a service</option>{services.map(service=><option key={service.id} value={service.title}>{service.title}</option>)}<option value={undecidedService}>{undecidedService}</option></select>{errors.service && <small id={`${fieldId}-service-error`} role="alert">{errors.service.message}</small>}</label>
      {field('budget','Estimated budget (USD)','number')}
      <label className="field inquiry-field">Project brief<textarea {...register('brief')} rows={5} aria-invalid={!!errors.brief} aria-describedby={errors.brief?`${fieldId}-brief-error`:undefined}/>{errors.brief && <small id={`${fieldId}-brief-error`} role="alert">{errors.brief.message}</small>}</label>
      <fieldset className="channel-preferences"><legend>Optional project updates</legend><label className="checkbox-label"><input type="checkbox" {...register('email_opt_in')}/>I agree to receive project and proposal updates by email.</label><label className="checkbox-label"><input type="checkbox" {...register('whatsapp_opt_in')}/>I agree to receive project and proposal updates on WhatsApp at the number above.</label><p className="muted">Both are optional. You can ask the team to stop updates at any time.</p></fieldset>
      <div hidden aria-hidden="true"><label>Website<input {...register('website')} tabIndex={-1} autoComplete="off"/></label></div>
      <button className="button button-primary" type="submit">{isSubmitting ? 'Saving your inquiry…' : 'Send project inquiry'}</button>
    </fieldset>{result && !result.success && <p role="alert" className="info-note">{result.message}</p>}</form>}
  </>;
}

