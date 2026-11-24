import {createHash} from 'node:crypto';
import {z} from 'zod';
import {endpoint,json,readJson,sameOrigin,HttpError,databaseError} from '@/lib/http';
import {createClient} from '@/lib/supabase/server';
export const POST=(request:Request)=>endpoint(async()=>{sameOrigin(request);const {token}=z.object({token:z.string().regex(/^[A-Za-z0-9_-]{43}$/)}).parse(await readJson(request));const db=await createClient();const result=await db.rpc('read_proposal_link',{p_digest:createHash('sha256').update(token).digest('hex')});databaseError(result.error);if(!result.data)throw new HttpError(404,'Scope unavailable.');return json({proposal:result.data});});
