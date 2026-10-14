import type { WorkflowLead } from '@/lib/leads/query';
import { Field, Area } from '../workspace-ui';
export function ContactFields({lead}:{lead?:WorkflowLead}) {
 return <>
  <Field label="Contact name" name="contact_name" value={lead?.contact_name}/>
  <Field label="Email" name="email" type="email" value={lead?.email}/>
  <label className="field" style={{marginBottom:16}}>Phone / WhatsApp<input className="input" name="phone" type="tel" defaultValue={lead?.phone??''} maxLength={32} placeholder="+639171234567" pattern="\+[1-9][0-9]{7,14}"/><span className="muted">Optional. Use the country code, starting with +.</span></label>
  <Field label="Service" name="service" value={lead?.service}/>
  <Area label="Project brief" name="brief" value={lead?.brief}/>
  <label className="field" style={{marginBottom:16}}>Budget in cents (USD)<input className="input" name="budget_cents" type="number" min={0} max={100000000} step={1} defaultValue={lead?.budget_cents??0} required/></label>
  <fieldset style={{border:'1px solid var(--border)',borderRadius:8,padding:16,marginBottom:20}}><legend>Messaging permission</legend>
   <label style={{display:'block',marginBottom:12}}><input type="checkbox" name="email_opt_in" defaultChecked={lead?.email_opt_in??false}/> Contact explicitly agreed to automated email follow-ups</label>
   <label style={{display:'block'}}><input type="checkbox" name="whatsapp_opt_in" defaultChecked={lead?.whatsapp_opt_in??false}/> Contact explicitly agreed to WhatsApp follow-ups</label>
   <p className="muted">Record permission only after the contact agrees. Adding a lead does not authorize messaging.</p>
  </fieldset>
 </>;
}
