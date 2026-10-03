import {redirect} from 'next/navigation';
import {AppShell} from '@/components/app-shell';
import {requireUser} from '@/lib/auth';
import {isDemo} from '@/lib/env';
export default async function Layout({children}:{children:React.ReactNode}){if(isDemo())redirect('/demo/portal');await requireUser();return <AppShell mode="live" role="client">{children}</AppShell>;}
