import type { ContactFormData } from '@/types/contact';
export async function submitContactForm(data: ContactFormData): Promise<void> {
 const response=await fetch('/api/inquire',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submission_id:crypto.randomUUID(),contact_name:data.name,email:data.email,phone:data.phone,brief:data.message,service:'Web & Mobile Applications',email_opt_in:false})});
 if(!response.ok){const result=await response.json();throw new Error(result.error||'Your inquiry could not be saved.');}
}
