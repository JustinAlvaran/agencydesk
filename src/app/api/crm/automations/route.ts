import {apiSession,endpoint,json,databaseError} from '@/lib/http';
export {POST} from './connect/route';
export const GET=()=>endpoint(async()=>{const {supabase}=await apiSession();const result=await supabase.from('integration_connections').select('provider,status,checked_at');databaseError(result.error);return json({automations:Object.fromEntries((result.data??[]).map(row=>[row.provider,{status:row.status,lastSync:row.checked_at??'Not tested'}]))});});
