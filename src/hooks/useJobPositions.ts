type JobPosition={id:string;title:string;employment_type:string;field:string};
export const useJobPositions=()=>({positions:[] as JobPosition[],positionsLoading:false,positionsError:null as string|null});
