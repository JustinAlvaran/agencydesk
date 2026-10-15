import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import catalog from '../../../content/fixtures.json' with { type: 'json' };
import { InquiryError, inquiryHash, parseInquiry, readInquiry } from '../_shared/inquiry.ts';

Deno.serve(async (request: Request) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (request.method !== 'POST') return new Response(JSON.stringify({error:'Method not allowed'}), {status:405,headers});
  try {
    const payload = parseInquiry(await readInquiry(request), [...catalog.services.filter(service => service.visibility === 'visible').map(service => service.title), 'Not sure yet']);
    const { contact_name, email, service, brief, budget_cents, phone, email_opt_in, whatsapp_opt_in, intake_source } = payload;
    // Email-based limit cannot be bypassed by supplying a different request_key.
    const request_key = await inquiryHash(email);
    const submission_id = payload.submission_id ?? crypto.randomUUID();
    const payload_hash = await inquiryHash(JSON.stringify({ contact_name, email, service, brief, budget_cents, phone, email_opt_in, whatsapp_opt_in, intake_source }));
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth:{persistSession:false,autoRefreshToken:false}});
    const {data:agency,error:agencyError} = await admin.from('agencies').select('id').eq('slug',Deno.env.get('AGENCY_SLUG') ?? 'agencydesk').eq('intake_enabled',true).maybeSingle();
    if (agencyError || !agency) return new Response(JSON.stringify({error:'Agency intake is unavailable'}),{status:503,headers});
    const {data,error} = await admin.rpc('submit_website_inquiry', {p_contact_name:contact_name,p_email:email,p_service:service,p_brief:brief,p_budget_cents:budget_cents,p_request_key:request_key,p_phone:phone,p_email_opt_in:email_opt_in,p_whatsapp_opt_in:whatsapp_opt_in,p_agency_id:agency.id,p_submission_id:submission_id,p_payload_hash:payload_hash,p_source:intake_source});
    if (error) return new Response(JSON.stringify({error:error.code==='23505'?'This submission changed. Please submit the updated inquiry again.':'Unable to submit inquiry'}), {status:error.code==='23505'?409:/rate|limit/i.test(error.message)?429:400,headers});
    return new Response(JSON.stringify({id:data}), {status:201,headers});
  } catch (error) { return new Response(JSON.stringify({error:error instanceof InquiryError?error.message:'Unable to submit inquiry'}), {status:error instanceof InquiryError?error.status:503,headers}); }
});
