import {requireStaff} from '@/lib/auth';
import WorkspaceShell from './workspace-shell';
export const dynamic='force-dynamic';
export default async function Layout({children}:{children:React.ReactNode}){const {user,staff}=await requireStaff();return <WorkspaceShell email={user.email??'Workspace member'} role={staff.role}>{children}</WorkspaceShell>;}
