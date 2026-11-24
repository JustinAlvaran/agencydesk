import {requireUser} from '@/lib/auth';
import {signOut} from '@/app/login/actions';
export const dynamic='force-dynamic';
export default async function Layout({children}:{children:React.ReactNode}){await requireUser();return <><div className="p-4 flex justify-end"><form action={signOut}><button className="text-sm text-primary">Sign out</button></form></div><div className="max-w-7xl mx-auto p-4">{children}</div></>;}
