'use server';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireStaff} from '@/lib/auth';
import {isDemo} from '@/lib/env';
import {leadStatuses} from '@/lib/domain';
import {formObject,uuid} from '@/lib/validation';
import {reportFailure} from '@/lib/operational-log';

const movableStages=leadStatuses.filter(stage=>stage!=='won');
const stageChange=z.object({id:uuid,expected_status:z.enum(movableStages),status:z.enum(movableStages)});

/** Stage-only compare-and-set. RLS and database triggers remain authoritative. */
export async function moveLeadStage(form:FormData):Promise<void>{
 if(isDemo())throw new Error('Demo mode is read-only.');
 const {supabase}=await requireStaff();
 const data=stageChange.parse(formObject(form));
 const {data:result,error}=await supabase.from('leads')
  .update({status:data.status}).eq('id',data.id).eq('status',data.expected_status)
  .is('archived_at',null).select('id').single();
 if(error){reportFailure('database_mutation',error);throw new Error('Could not change this stage. Refresh the board and try again.');}
 if(!result)throw new Error('This lead changed or is unavailable. Refresh the board.');
 revalidatePath('/crm','layout');
}
