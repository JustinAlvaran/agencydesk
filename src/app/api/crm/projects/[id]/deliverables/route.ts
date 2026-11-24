import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {apiSession,endpoint,json,sameOrigin,HttpError,databaseError} from '@/lib/http';
import {serviceClient} from '@/lib/supabase/admin';
export const POST=(request:Request,{params}:{params:Promise<{id:string}>})=>endpoint(async()=>{
 sameOrigin(request);const {supabase,staff}=await apiSession();const id=z.uuid().parse((await params).id);
 const project=await supabase.from('projects').select('id').eq('id',id).maybeSingle();databaseError(project.error);if(!project.data)throw new HttpError(404,'Project unavailable.');
 const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Choose a file.');const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>4194304+16384){await reader.cancel();throw new HttpError(413,'The file must be no larger than 4 MB.');}chunks.push(part.value);}}finally{reader.releaseLock();}
 const form=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':request.headers.get('content-type')??''}}).formData();const file=form.get('file');
 if(!(file instanceof File)||file.size<1||file.size>4194304||!['application/pdf','image/png','image/jpeg','application/zip','text/plain'].includes(file.type))throw new HttpError(400,'Choose a supported file up to 4 MB.');
 const name=file.name.replace(/[\x00-\x1f/\\]/g,'_').slice(0,200);const path=`${staff!.agency_id}/${id}/${randomUUID()}`;
 const storage=serviceClient().storage.from('agencydesk-deliverables');const upload=await storage.upload(path,file,{contentType:file.type,upsert:false});if(upload.error)throw new HttpError(503,'Upload could not be saved.');
 const saved=await supabase.from('deliverables').insert({agency_id:staff!.agency_id,project_id:id,name,object_path:path,content_type:file.type,size_bytes:file.size});
 if(saved.error){await storage.remove([path]);databaseError(saved.error);}
 return json({success:true},201);
});
