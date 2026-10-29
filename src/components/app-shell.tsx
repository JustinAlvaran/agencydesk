"use client";

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import {ArrowUpRight,BriefcaseBusiness,CheckSquare,FileText,LayoutDashboard,Menu,PanelsTopLeft,Users,X,Workflow} from 'lucide-react';
import {useState,type ReactNode} from 'react';
import {signOut} from '@/app/login/actions';
import {cn} from './ui/primitives';
import styles from './app-shell.module.css';

const navigation=[{name:'Overview',path:'',icon:LayoutDashboard},{name:'Lead pipeline',path:'/leads',icon:PanelsTopLeft},{name:'Proposals',path:'/proposals',icon:FileText},{name:'Projects',path:'/projects',icon:BriefcaseBusiness},{name:'Tasks',path:'/tasks',icon:CheckSquare},{name:'Contacts',path:'/contacts',icon:Users},{name:'Automations',path:'/automations',icon:Workflow}];

export function AppShell({children,mode='demo',role='staff',title,description}:{children:ReactNode;mode?:'demo'|'live';role?:'staff'|'client';title?:string;description?:string}) {
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  const base=role==='client'?(mode==='demo'?'/demo/portal':'/portal'):(mode==='demo'?'/demo':'/crm');
  const links=role==='client'?(mode==='demo'?[{name:'My workspace',path:'',icon:LayoutDashboard}]:[{name:'My workspace',path:'',icon:LayoutDashboard},{name:'Proposals',path:'/proposals',icon:FileText},{name:'Projects',path:'/projects',icon:BriefcaseBusiness}]):navigation;
  const active=links.find(item=>item.path&&pathname.startsWith(`${base}${item.path}`))||links[0];
  const nav=<>
    <Link href={base} className={styles.brand} onClick={()=>setOpen(false)} aria-label='AgencyDesk overview'>
      <span className={styles.brandMark} aria-hidden='true'><PanelsTopLeft size={21}/></span>
      <span>AgencyDesk<span className={styles.brandCaption}>A little more in control.</span></span>
    </Link>
    <p className='workspace-label'>{role==='client'?'Client workspace':'Staff workspace'}</p>
    <nav aria-label='Workspace navigation' className='app-nav'>
      {links.map(item=>{
        const selected=item.path?pathname.startsWith(`${base}${item.path}`):pathname===base;
        return <Link key={item.path} href={`${base}${item.path}`} onClick={()=>setOpen(false)} aria-current={selected?'page':undefined} className={cn('app-nav-link',selected&&'active')}><item.icon size={18} aria-hidden='true'/>{item.name}</Link>;
      })}
      {mode==='live'&&role==='staff'&&<Link href='/crm/settings' onClick={()=>setOpen(false)} aria-current={pathname==='/crm/settings'?'page':undefined} className={cn('app-nav-link',pathname==='/crm/settings'&&'active')}><Users size={18} aria-hidden='true'/>People & settings</Link>}
    </nav>
    <div className='sidebar-bottom'>
      <div className={styles.sidebarNote}><span className={styles.smallMark} aria-hidden='true'><BriefcaseBusiness size={16}/></span><div><strong>{role==='client'?'Your shared space':'Your agency workspace'}</strong><p>{mode==='demo'?'Explore the workflow':'Built around your next step'}</p></div></div>
      <Link href='/' className='back-site'>Back to website <ArrowUpRight size={14} aria-hidden='true'/></Link>
      {mode==='live'&&<form action={signOut}><button className='back-site' type='submit'>Sign out</button></form>}
      <p className='session-note'>{mode==='demo'?'Read-only demonstration':'Signed-in workspace'}</p>
    </div>
  </>;
  return <div className={cn('app-theme',styles.root)}>
    <aside className='app-sidebar'>{nav}</aside>
    <div className='app-main'>
      <header className='app-topbar'>
        <div className='topbar-breadcrumb'>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger className='icon-button mobile-menu' aria-label='Open navigation'><Menu size={20} aria-hidden='true'/></Dialog.Trigger>
            <Dialog.Portal><Dialog.Overlay className='sheet-overlay'/><Dialog.Content className={cn('mobile-sheet',styles.drawer)}><Dialog.Title className='sr-only'>Workspace navigation</Dialog.Title><Dialog.Description className='sr-only'>Choose a workspace section.</Dialog.Description><Dialog.Close className='sheet-close icon-button' aria-label='Close navigation'><X size={20} aria-hidden='true'/></Dialog.Close>{nav}</Dialog.Content></Dialog.Portal>
          </Dialog.Root>
          <Link href={base}>Workspace</Link><span className={styles.breadcrumbDivider} aria-hidden='true'>/</span><span>{title||(pathname==='/crm/settings'?'People & settings':active.name)}</span>
        </div>
        <span className={styles.sessionState}><span aria-hidden='true'/>{mode==='demo'?'Demo':'Signed in'}</span>
      </header>
      {mode==='demo'&&<div className='demo-banner'><span><strong>Fictional sample data</strong><span className={styles.demoDetail}> · Changes are disabled in this demo.</span></span><Link href={role==='client'?'/demo':'/demo/portal'}>{role==='client'?'See staff workspace':'See client experience'} <ArrowUpRight size={13} aria-hidden='true'/></Link></div>}
      <main id='main-content' className='workspace-content'>{description&&<p className='muted'>{description}</p>}{children}</main>
    </div>
  </div>;
}
