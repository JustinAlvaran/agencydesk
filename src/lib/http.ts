import 'server-only';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/env';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
}
export function endpoint(fn: () => Promise<Response>) {
  return fn().catch((error: unknown) => {
    if (error instanceof HttpError) return json({error: error.message}, error.status);
    if (error instanceof z.ZodError) return json({error:'Check the submitted fields.', fields:error.flatten().fieldErrors},400);
    return json({error:'The operation could not be completed. Try again.'},503);
  });
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const configured = process.env.APP_URL;
  if (!configured) throw new HttpError(503,'Application origin is not configured.');
  if (origin !== new URL(configured).origin) throw new HttpError(403,'Request origin is not allowed.');
}
export async function readJson(request: Request, limit = 16384): Promise<unknown> {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new HttpError(415,'Use application/json.');
  return JSON.parse(await readBody(request,limit));
}
export async function readBody(request: Request, limit = 16384) {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400,'Request body is required.');
  const chunks: Uint8Array[]=[]; let size=0;
  try { while(true) { const {done,value}=await reader.read(); if(done)break; size+=value.byteLength;
    if(size>limit) { await reader.cancel(); throw new HttpError(413,'Request is too large.'); } chunks.push(value);
  } } finally { reader.releaseLock(); }
  return new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));
}
export async function apiSession(role: 'user' | 'staff' | 'admin' = 'staff') {
  if (!isConfigured()) throw new HttpError(503,'Workspace is not configured.');
  const supabase = await createClient();
  const {data,error} = await supabase.auth.getUser();
  if (error || !data.user) throw new HttpError(401,'Sign in to continue.');
  const staff = await supabase.from('staff_members').select('user_id,role,agency_id').eq('user_id',data.user.id).eq('active',true).maybeSingle();
  if (staff.error) throw new HttpError(503,'Could not verify workspace access.');
  if (role !== 'user' && (!staff.data || (role === 'admin' && staff.data.role !== 'admin'))) throw new HttpError(403,'Workspace permission required.');
  return {supabase,user:data.user,staff:staff.data};
}
export function databaseError(error: {code?:string} | null) {
  if (!error) return;
  if (error.code === '40001') throw new HttpError(409,'This record changed. Reload before trying again.');
  if (error.code === '42501') throw new HttpError(403,'You do not have permission for this change.');
  if (['22023','23514','23505','P0001'].includes(error.code ?? '')) throw new HttpError(409,'The change conflicts with the current record or its approval rules.');
  throw new HttpError(503,'Could not save the change.');
}
