import {z} from 'zod';
import {leadStatuses} from './domain';
export const uuid = z.string().uuid();
const text = (max=200) => z.string().trim().min(1).max(max);
export const inquirySchema = z.object({contact_name:text(100),email:z.string().trim().toLowerCase().max(254).pipe(z.email()),phone:z.union([z.literal(''),z.string().trim().regex(/^\+[1-9]\d{7,14}$/,'Use a country code, for example +639171234567')]).optional(),email_opt_in:z.boolean().optional(),whatsapp_opt_in:z.boolean().optional(),service:text(100),brief:z.string().trim().min(20,'Use at least 20 characters for your project brief').max(4000),budget_cents:z.coerce.number().int().min(10000).max(100000000),website:z.string().max(0).optional()});
export const leadSchema=z.object({id:uuid,status:z.enum(leadStatuses),owner_id:z.union([uuid,z.literal('')]).transform(v=>v||null),company_id:z.union([uuid,z.literal('')]).transform(v=>v||null),archived:z.enum(['true','false'])});
export const taskSchema=z.object({title:text(),due_at:z.string().min(1),lead_id:uuid,assigned_to:z.union([uuid,z.literal('')]).transform(v=>v||null)});
export const proposalSchema=z.object({lead_id:uuid,company_id:uuid,title:text()});
export const revisionSchema=z.object({series_id:uuid,scope:text(10000),expires_at:z.string().min(1)});
export const itemSchema=z.object({revision_id:uuid,description:text(1000),quantity:z.coerce.number().int().min(1).max(10000),unit_price_cents:z.coerce.number().int().min(1).max(100000000)});
export function formObject(form:FormData) {return Object.fromEntries(form.entries());}
