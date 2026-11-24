import {z} from 'zod';
import {apiSession,endpoint,json,readJson,sameOrigin,databaseError} from '@/lib/http';
export const POST=(request:Request,{params}:{params:Promise<{id:string}>})=>endpoint(async()=>{sameOrigin(request);const {supabase}=await apiSession('user');const id=z.uuid().parse((await params).id);z.object({confirm:z.literal(true)}).parse(await readJson(request));const result=await supabase.rpc('accept_proposal_revision',{revision_id:id});databaseError(result.error);return json({project_id:result.data});});
