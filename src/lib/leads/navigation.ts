/** Only return to our lead list. Never accept an external or arbitrary app URL. */
export function leadListReturn(value:unknown):string{
 if(typeof value!=='string'||!/^\/crm\/leads(?:\?|$)/.test(value))return '/crm/leads';
 const url=new URL(value,'https://agencydesk.invalid');
 if(url.pathname!=='/crm/leads'||url.origin!=='https://agencydesk.invalid')return '/crm/leads';
 const query=new URLSearchParams();
 for(const key of ['q','status','owner','show','view','page']){const v=url.searchParams.get(key);if(v!==null)query.set(key,v.slice(0,150));}
 return `/crm/leads${query.size?`?${query}`:''}`;
}
