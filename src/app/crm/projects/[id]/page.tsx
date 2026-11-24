import {ProjectDetail} from '@/components/crm/project-detail';
export default async function Page({params}:{params:Promise<{id:string}>}){return <ProjectDetail id={(await params).id}/>;}
