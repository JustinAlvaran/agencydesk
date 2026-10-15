'use client';

import ChatBot, { type Flow, type Params, type Settings, type Styles } from 'react-chatbotify';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { InquiryForm } from '@/app/inquire/inquiry-form';
import { assistantAnswers, assistantServiceAnswer, assistantTopics, type AssistantService } from '@/lib/service-assistant';
import { undecidedService } from '@/lib/service-catalog';

const settings: Settings = {
  general: { embedded: true, showHeader: false, showFooter: false, showInputRow: false, primaryColor: '#292927', secondaryColor: '#292927' },
  chatHistory: { disabled: true },
  notification: { disabled: true }, audio: { disabled: true }, voice: { disabled: true },
  fileAttachment: { disabled: true }, emoji: { disabled: true },
  botBubble: { animate: false }, userBubble: { animate: false },
  chatInput: { botDelay: 0 },
  chatWindow: { showScrollbar: true, showMessagePrompt: false },
};
const styles: Styles = {
  chatWindowStyle: { width: '100%', height: '100%', borderRadius: 0, boxShadow: 'none', border: 'none' },
  bodyStyle: { backgroundColor: '#fff', padding: '12px' },
  botBubbleStyle: { backgroundColor: '#f0f0ec', color: '#20201e', whiteSpace: 'pre-line', maxWidth: '100%' },
  userBubbleStyle: { backgroundColor: '#292927', color: '#fff' },
  botOptionStyle: { color: '#20201e', borderColor: '#777770', backgroundColor: '#fff', minHeight: 44, whiteSpace: 'normal' },
  botOptionHoveredStyle: { color: '#20201e', backgroundColor: '#efefeb', borderColor: '#292927' },
};

function InquiryLink({ onInquire, service }: { onInquire: (service: string) => void; service?: AssistantService }) {
  return <div className="assistant-actions">{service ? <Link href={`/services/${service.id}`}>Read service details</Link> : null}<button type="button" className="button button-primary" onClick={() => onInquire(service?.title ?? undecidedService)}>Prepare project inquiry</button></div>;
}

// The library's default options are non-semantic divs. Keep its flow engine and
// message UI while providing native controls for keyboard and screen-reader use.
function GuideChoices({ params, items, children }: { params: Params; items: Array<{ label: string; path: string }>; children?: ReactNode }) {
  const [busy, setBusy] = useState(false);
  async function choose(label: string, path: string) {
    if (busy) return;
    setBusy(true);
    try { await params.injectMessage(label, 'user'); await params.goToPath(path); }
    finally { setBusy(false); }
  }
  return <div className="assistant-choice-block">{children}<div className="assistant-choices" aria-label="Guide topics">{items.map(item => <button key={item.path} type="button" className="button button-secondary" disabled={busy} onClick={() => { void choose(item.label, item.path); }}>{item.label}</button>)}</div></div>;
}

export default function AssistantConversation({ services, available }: { services: AssistantService[]; available: boolean }) {
  const [inquiryService, setInquiryService] = useState<string | null>(null);
  const flow = useMemo<Flow>(() => {
    const topics = assistantTopics.map((label, index) => ({ label, path: ['services', 'process', 'pricing', 'handoff'][index] }));
    const menu = (params: Params, children?: ReactNode) => <GuideChoices params={params} items={topics}>{children}</GuideChoices>;
    const result: Flow = {
      start: { message: 'Welcome! I can explain AgencyDesk’s services and help you prepare an inquiry. Choose a topic below. Please keep passwords and private account details out of your inquiry.', component: (params: Params) => menu(params), chatDisabled: true },
      services: { message: 'Which service would you like to explore?', component: (params: Params) => <GuideChoices params={params} items={[...services.map((service, index) => ({ label: service.title, path: `service_${index}` })), { label: 'Help me choose', path: 'choose' }]}/>, chatDisabled: true },
      choose: { message: 'A public business presence fits a business website. Improvements to an existing site fit a redesign. Shared business records or client access fit an application or portal. Lead intake and follow-up workflows fit CRM and automation setup. The team can review a brief if you are unsure.', component: (params: Params) => menu(params, <InquiryLink onInquire={setInquiryService}/>), chatDisabled: true },
      process: { message: assistantAnswers.process, component: (params: Params) => menu(params), chatDisabled: true },
      pricing: { message: assistantAnswers.pricing, component: (params: Params) => menu(params, <InquiryLink onInquire={setInquiryService}/>), chatDisabled: true },
      handoff: { message: assistantAnswers.handoff, component: (params: Params) => menu(params, <InquiryLink onInquire={setInquiryService}/>), chatDisabled: true },
      fallback: { message: 'This guide covers our published services. For a custom question, send an inquiry for the team to review.', component: (params: Params) => menu(params, <InquiryLink onInquire={setInquiryService}/>), chatDisabled: true },
    };
    services.forEach((service, index) => { result[`service_${index}`] = { message: assistantServiceAnswer(service), component: (params: Params) => menu(params, <InquiryLink service={service} onInquire={setInquiryService}/>), chatDisabled: true }; });
    return result;
  }, [services]);

  if (inquiryService !== null) return <div className="assistant-inquiry"><button type="button" className="button button-secondary" onClick={() => setInquiryService(null)}>Back to service guide</button><h3>Review your project inquiry</h3><p className="muted">Share the outcome you need and your desired timeline. Submitting saves your contact details and brief in AgencyDesk so the team can review them. Optional update permissions start unchecked.</p><InquiryForm available={available} services={services} initialService={inquiryService} intakeSource="website_chatbot"/></div>;
  return <div className="assistant-chat"><ChatBot id="agencydesk-services" flow={flow} settings={settings} styles={styles}/><p className="assistant-note">No live agent or automatic quote. <Link href="/inquire">Use the inquiry form</Link> anytime.</p></div>;
}
