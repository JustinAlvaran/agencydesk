// A2UI 0.15 uses Zod 3. Keep AgencyDesk's existing Zod 4 schemas unchanged.
import {z} from 'zod-a2ui';
import {ActionSchema, ChildListSchema} from '@a2ui/web_core/v1_0';

export const reviewApi = {
  name: 'LeadReview', allowedParents: ['Surface'], allowedChildren: ['LeadCard', 'LeadDetail'],
  schema: z.object({title: z.string(), description: z.string(), count: z.number().int().nonnegative(), children: ChildListSchema}).strict(),
};
export const leadCardApi = {
  name: 'LeadCard', allowedParents: ['LeadReview'], allowedChildren: [],
  schema: z.object({name: z.string(), service: z.string(), stage: z.string(), budget: z.string(), onInspect: ActionSchema}).strict(),
};
export const leadDetailApi = {
  name: 'LeadDetail', allowedParents: ['LeadReview'], allowedChildren: [],
  schema: z.object({name: z.string(), service: z.string(), brief: z.string(), nextStep: z.string()}).strict(),
};
