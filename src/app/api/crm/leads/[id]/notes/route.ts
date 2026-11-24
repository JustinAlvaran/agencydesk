import {z} from 'zod';
import {apiSession,endpoint,json,readJson,sameOrigin,databaseError} from '@/lib/http';
export const POST=(request:Request,{params}:{params:Promise<{id:string}>})=>endpoint(async()=>{
 sameOrigin(request);const {supabase,user}=await apiSession();const id=z.uuid().parse((await params).id);
 const {note}=z.object({note:z.string().trim().min(1).max(4000)}).parse(await readJson(request));
 const {error}=await supabase.from('lead_notes').insert({lead_id:id,body:note,author_id:user.id});databaseError(error);return json({success:true},201);
});
