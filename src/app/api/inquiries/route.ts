import {inquirySchema} from '@/lib/validation';
import {isDemo} from '@/lib/env';
import {submitInquiry} from '@/lib/supabase/inquiry';
import {publicServices} from '@/lib/website-content';
import {undecidedService} from '@/lib/service-catalog';
export async function POST(request:Request){
 if(isDemo())return Response.json({error:'Inquiry submission is unavailable in this read-only demo.'},{status:503});
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Request origin is not allowed.'},{status:403});
 const contentLength=Number(request.headers.get('content-length')??0);if(contentLength>16000)return Response.json({error:'Inquiry is too large.'},{status:413});
 let input:unknown;try{const body=await request.text();if(body.length>16000)return Response.json({error:'Inquiry is too large.'},{status:413});input=JSON.parse(body);}catch{return Response.json({error:'Provide a valid inquiry.'},{status:400});}
 const parsed=inquirySchema.safeParse(input);if(!parsed.success)return Response.json({error:'Check your contact details, project brief, and budget.',fields:parsed.error.flatten().fieldErrors},{status:400});
 if(parsed.data.service!==undecidedService&&!publicServices.some(service=>service.title===parsed.data.service))return Response.json({error:'Choose an available service or select Not sure yet.',fields:{service:['Choose a service from the current catalog.']}},{status:400});
 if(parsed.data.whatsapp_opt_in && !parsed.data.phone)return Response.json({error:'Add your phone number to request WhatsApp updates.',fields:{phone:['A phone number is required for WhatsApp updates.']}},{status:400});
 // The Edge function derives the rate-limit key itself and applies a persistent
 // database limit, preventing a public caller from choosing an arbitrary key.
 try{await submitInquiry(parsed.data);return Response.json({success:true},{status:201});}catch(error){const message=error instanceof Error?error.message:'We could not save your inquiry.';return Response.json({error:message},{status:message.includes('Too many')?429:503});}
}
