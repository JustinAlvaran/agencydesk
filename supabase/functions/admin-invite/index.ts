import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

Deno.serve(async (request: Request) => {
  const headers = { 'Content-Type':'application/json', 'Cache-Control':'private, no-store' };
  if (request.method !== 'POST') return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers});
  const admin = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const bearer = request.headers.get('Authorization')?.replace(/^Bearer /,'');
  if (!bearer) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers});
  const {data:identity,error:authError} = await admin.auth.getUser(bearer);
  if (authError || !identity.user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers});
  const {data:staff} = await admin.from('staff_members').select('role,active,agency_id').eq('user_id',identity.user.id).maybeSingle();
  if (!staff?.active || staff.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers});
  try {
    const body = await request.json();
    const email = String(body.email??'').trim().toLowerCase();
    const role = body.role;
    const caller=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:`Bearer ${bearer}`}},auth:{persistSession:false,autoRefreshToken:false}});
    const type = body.type === 'recovery' ? 'recovery' : 'invite';
    const base = new URL(body.app_url);
    const allowedOrigins=(Deno.env.get('ALLOWED_APP_ORIGINS')??'https://agencydesk-theta.vercel.app').split(',').map(value=>value.trim());
    if (!allowedOrigins.includes(base.origin) && !(base.protocol === 'http:' && ['localhost','127.0.0.1'].includes(base.hostname))) return new Response(JSON.stringify({error:'Invalid application origin'}),{status:400,headers});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['client','staff','admin','agency_owner'].includes(role)) return new Response(JSON.stringify({error:'Invalid invitation'}),{status:400,headers});
    if (role==='agency_owner' && (type!=='invite' || staff.agency_id!=='a0000000-0000-4000-8000-000000000001' || typeof body.agency_name!=='string' || body.agency_name.trim().length<1 || body.agency_name.length>200 || typeof body.agency_slug!=='string' || !/^[a-z0-9][a-z0-9-]{2,79}$/.test(body.agency_slug))) return new Response(JSON.stringify({error:'Invalid agency invitation'}),{status:400,headers});
    if (type === 'invite' && role === 'client') {
      const {data:company} = await admin.from('companies').select('id').eq('id',body.company_id).eq('agency_id',staff.agency_id).maybeSingle();
      if (!company) return new Response(JSON.stringify({error:'Choose an existing company'}),{status:400,headers});
    }
    if (type==='recovery') {
      // Recovery resets a global identity, so tenant admins must never receive it.
      if(staff.agency_id!=='a0000000-0000-4000-8000-000000000001')return new Response(JSON.stringify({error:'Ask the platform owner for account recovery'}),{status:403,headers});
      const {data:account,error:lookupError}=await caller.rpc('workspace_account',{account_email:email});
      if(lookupError||!account)return new Response(JSON.stringify({error:'Account unavailable in this workspace'}),{status:400,headers});
    }
    const {data,error} = await admin.auth.admin.generateLink({type,email});
    if (error || !data.user || !data.properties.hashed_token) return new Response(JSON.stringify({error:'Unable to generate link. Use recovery for existing accounts.'}),{status:400,headers});
    if (type === 'invite') {
      const assignment = role === 'agency_owner'
        ? await caller.rpc('provision_agency',{agency_name:body.agency_name,agency_slug:body.agency_slug,owner_user_id:data.user.id})
        : role === 'client'
        ? await caller.from('client_memberships').insert({user_id:data.user.id,company_id:body.company_id,active:true,can_accept_proposals:body.can_accept_proposals===true,agency_id:staff.agency_id})
        : await caller.from('staff_members').insert({user_id:data.user.id,role,active:true,agency_id:staff.agency_id});
      if (assignment.error) { await admin.auth.admin.deleteUser(data.user.id); return new Response(JSON.stringify({error:'Could not assign account access'}),{status:400,headers}); }
    }
    const link = new URL('/auth/confirm',base.origin);
    link.searchParams.set('token_hash',data.properties.hashed_token);
    link.searchParams.set('type',type);
    return new Response(JSON.stringify({link:link.toString()}),{status:200,headers});
  } catch { return new Response(JSON.stringify({error:'Invalid invitation request'}),{status:400,headers}); }
});
