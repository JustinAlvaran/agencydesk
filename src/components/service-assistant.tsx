'use client';

import * as Dialog from '@radix-ui/react-dialog';
import dynamic from 'next/dynamic';
import { Component, useState, type ReactNode } from 'react';
import { MessageCircle, X } from 'lucide-react';
import type { AssistantService } from '@/lib/service-assistant';

const AssistantConversation = dynamic(() => import('./service-assistant-conversation'), {
  ssr: false,
  loading: () => <p role="status" className="assistant-loading">Loading the services guide…</p>,
});

class AssistantBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <p role="alert" className="assistant-loading">The guide could not load. <a href="/inquire">Use the project inquiry form</a> to contact the team.</p> : this.props.children;
  }
}

export function ServiceAssistant({ services, available }: { services: AssistantService[]; available: boolean }) {
  const [open, setOpen] = useState(false);
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild><button type="button" className="button button-primary assistant-trigger"><MessageCircle size={18} aria-hidden="true"/>Ask about services</button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="assistant-overlay"/>
      <Dialog.Content className="assistant-dialog">
        <header className="assistant-heading"><div><Dialog.Title>AgencyDesk services guide</Dialog.Title><Dialog.Description>Explore services and prepare a project inquiry. Guided answers, available anytime.</Dialog.Description></div><Dialog.Close asChild><button type="button" className="icon-button" aria-label="Close services guide"><X size={20} aria-hidden="true"/></button></Dialog.Close></header>
        {open ? <AssistantBoundary><AssistantConversation services={services} available={available}/></AssistantBoundary> : null}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
