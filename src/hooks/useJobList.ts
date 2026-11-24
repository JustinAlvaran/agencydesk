import type {Career} from "@/types/careers";
export function useJobList(){return {jobs:[] as Career[],loading:false,error:null as string|null};}
