'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
export function DeliverableUpload({projectId}:{projectId:string}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');const router=useRouter();
 return <form className="flex flex-col gap-3" onSubmit={async event=>{event.preventDefault();setBusy(true);setMessage('');const form=event.currentTarget;
 try{const response=await fetch(`/api/crm/projects/${projectId}/deliverables`,{method:'POST',body:new FormData(form)});const data=await response.json();if(!response.ok)throw new Error(data.error);setMessage('Deliverable uploaded.');form.reset();router.refresh();}catch(error){setMessage(error instanceof Error?error.message:'Upload failed.');}finally{setBusy(false);}}}>
 <label className="text-sm">Deliverable (PDF, image, ZIP, or text; up to 4 MB)<input name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.zip,.txt" className="block w-full p-3 border rounded-xl mt-2"/></label>
 <button disabled={busy} className="self-start bg-primary text-white rounded-xl px-4 py-2 text-sm">{busy?'Uploading…':'Upload deliverable'}</button>{message&&<p role="status" className="text-sm">{message}</p>}
 </form>;
}
