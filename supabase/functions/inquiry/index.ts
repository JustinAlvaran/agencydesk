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
    const phone = body.phone == null || body.phone === '' ? null : String(body.phone).trim();
    if ((phone !== null && !/^\+[1-9]\d{7,14}$/.test(phone)) || (body.email_opt_in !== undefined && typeof body.email_opt_in !== 'boolean') || (body.whatsapp_opt_in !== undefined && typeof body.whatsapp_opt_in !== 'boolean') || (body.whatsapp_opt_in === true && !phone)) return new Response(JSON.stringify({error:'Invalid channel preferences'}), {status:400,headers});
    const email_opt_in = body.email_opt_in === true, whatsapp_opt_in = body.whatsapp_opt_in === true;
    if (!contact_name || contact_name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !service || service.length > 100 || brief.length < 20 || brief.length > 4000 || !Number.isSafeInteger(budget_cents) || budget_cents < 10000 || budget_cents > 100000000) return new Response(JSON.stringify({error:'Invalid inquiry'}), {status:400,headers});
    // Email-based limit cannot be bypassed by supplying a different request_key.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email));
    const request_key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth:{persistSession:false,autoRefreshToken:false}});
    const {data:agency,error:agencyError} = await admin.from('agencies').select('id').eq('slug',Deno.env.get('AGENCY_SLUG') ?? 'agencydesk').eq('intake_enabled',true).maybeSingle();
    if (agencyError || !agency) return new Response(JSON.stringify({error:'Agency intake is unavailable'}),{status:503,headers});
    const {data,error} = await admin.rpc('submit_inquiry_with_preferences', {contact_name,email,service,brief,budget_cents,request_key,phone,email_opt_in,whatsapp_opt_in,target_agency_id:agency.id});
    if (error) return new Response(JSON.stringify({error:'Unable to submit inquiry'}), {status:/rate|limit/i.test(error.message)?429:400,headers});
    return new Response(JSON.stringify({id:data}), {status:201,headers});
  } catch { return new Response(JSON.stringify({error:'Invalid request'}), {status:400,headers}); }
});
