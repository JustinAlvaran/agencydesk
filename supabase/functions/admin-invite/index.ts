import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

Deno.serve(async (request: Request) => {
  const headers = { 'Content-Type':'application/json', 'Cache-Control':'private, no-store' };
  if (request.method !== 'POST') return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers});
  const admin = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const bearer = request.headers.get('Authorization')?.replace(/^Bearer /,'');
  if (!bearer) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers});
  const {data:identity,error:authError} = await admin.auth.getUser(bearer);
  if (authError || !identity.user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers});
  const {data:staff} = await admin.from('staff_members').select('role,active').eq('user_id',identity.user.id).maybeSingle();
  if (!staff?.active || staff.role !== 'admin') return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers});
  try {
    const body = await request.json();
    const email = String(body.email??'').trim().toLowerCase();
    const role = body.role;
    const type = body.type === 'recovery' ? 'recovery' : 'invite';
    const base = new URL(body.app_url);
    if (!(base.protocol === 'https:' && /^agencydesk(?:-[a-z0-9-]+)?(?:\.vercel)?\.app$/.test(base.hostname)) && !(base.protocol === 'http:' && ['localhost','127.0.0.1'].includes(base.hostname))) return new Response(JSON.stringify({error:'Invalid application origin'}),{status:400,headers});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['client','staff','admin'].includes(role)) return new Response(JSON.stringify({error:'Invalid invitation'}),{status:400,headers});
    if (type === 'invite' && role === 'client') {
      const {data:company} = await admin.from('companies').select('id').eq('id',body.company_id).maybeSingle();
      if (!company) return new Response(JSON.stringify({error:'Choose an existing company'}),{status:400,headers});
    }
    const {data,error} = await admin.auth.admin.generateLink({type,email});
    if (error || !data.user || !data.properties.hashed_token) return new Response(JSON.stringify({error:'Unable to generate link. Use recovery for existing accounts.'}),{status:400,headers});
    if (type === 'invite') {
      const assignment = role === 'client'
        ? await admin.from('client_memberships').upsert({user_id:data.user.id,company_id:body.company_id,active:true,can_accept_proposals:body.can_accept_proposals===true})
        : await admin.from('staff_members').upsert({user_id:data.user.id,role,active:true});
      if (assignment.error) { await admin.auth.admin.deleteUser(data.user.id); return new Response(JSON.stringify({error:'Could not assign account access'}),{status:400,headers}); }
    }
    const link = new URL('/auth/confirm',base.origin);
    link.searchParams.set('token_hash',data.properties.hashed_token);
    link.searchParams.set('type',type);
    return new Response(JSON.stringify({link:link.toString()}),{status:200,headers});
  } catch { return new Response(JSON.stringify({error:'Invalid invitation request'}),{status:400,headers}); }
});
