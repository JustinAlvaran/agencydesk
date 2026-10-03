import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

Deno.serve(async (request: Request) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (request.method !== 'POST') return new Response(JSON.stringify({error:'Method not allowed'}), {status:405,headers});
  try {
    const body = await request.json();
    const contact_name = String(body.contact_name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const service = String(body.service ?? '').trim();
    const brief = String(body.brief ?? '').trim();
    const budget_cents = Number(body.budget_cents);
    if (!contact_name || contact_name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !service || service.length > 100 || brief.length < 20 || brief.length > 4000 || !Number.isSafeInteger(budget_cents) || budget_cents < 10000 || budget_cents > 100000000) return new Response(JSON.stringify({error:'Invalid inquiry'}), {status:400,headers});
    // Email-based limit cannot be bypassed by supplying a different request_key.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email));
    const request_key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error} = await admin.rpc('submit_inquiry', {contact_name,email,service,brief,budget_cents,request_key});
    if (error) return new Response(JSON.stringify({error:'Unable to submit inquiry'}), {status:/rate|limit/i.test(error.message)?429:400,headers});
    return new Response(JSON.stringify({id:data}), {status:201,headers});
  } catch { return new Response(JSON.stringify({error:'Invalid request'}), {status:400,headers}); }
});
