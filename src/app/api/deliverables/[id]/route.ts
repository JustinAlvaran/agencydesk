import {z} from 'zod';
import {apiSession,endpoint,HttpError,databaseError} from '@/lib/http';
import {serviceClient} from '@/lib/supabase/admin';
export const GET=(_request:Request,{params}:{params:Promise<{id:string}>})=>endpoint(async()=>{
 const {supabase}=await apiSession('user');const id=z.uuid().parse((await params).id);
 const file=await supabase.from('deliverables').select('object_path,name').eq('id',id).maybeSingle();databaseError(file.error);if(!file.data)throw new HttpError(404,'Deliverable unavailable.');
 const signed=await serviceClient().storage.from('agencydesk-deliverables').createSignedUrl(file.data.object_path,60,{download:file.data.name});if(signed.error||!signed.data)throw new HttpError(503,'Download is unavailable.');
 return new Response(null,{status:303,headers:{Location:signed.data.signedUrl,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
});
