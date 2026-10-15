'use client';

import ChatBot, { type Flow, type Settings, type Styles } from 'react-chatbotify';
import Link from 'next/link';
import { useMemo, useState } from 'react';
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

export default function AssistantConversation({ services, available }: { services: AssistantService[]; available: boolean }) {
  const [inquiryService, setInquiryService] = useState<string | null>(null);
  const flow = useMemo<Flow>(() => {
    const menu = { options: assistantTopics, chatDisabled: true, path: ({ userInput }: { userInput: string }) => ({
      'Explore services': 'services', 'How projects work': 'process', 'Pricing and timing': 'pricing', 'Request a follow-up': 'handoff',
    })[userInput] ?? 'fallback' };
    const result: Flow = {
      start: { message: 'Welcome! I can explain AgencyDesk’s services and help you prepare an inquiry. Choose a topic below. Please keep passwords and private account details out of your inquiry.', ...menu },
      services: { message: 'Which service would you like to explore?', options: [...services.map(service => service.title), 'Help me choose'], chatDisabled: true, path: ({ userInput }) => {
        const index = services.findIndex(service => service.title === userInput);
        return index >= 0 ? `service_${index}` : 'choose';
      } },
      choose: { message: 'A public business presence fits a business website. Improvements to an existing site fit a redesign. Shared business records or client access fit an application or portal. Lead intake and follow-up workflows fit CRM and automation setup. The team can review a brief if you are unsure.', component: <InquiryLink onInquire={setInquiryService}/>, ...menu },
      process: { message: assistantAnswers.process, ...menu },
      pricing: { message: assistantAnswers.pricing, component: <InquiryLink onInquire={setInquiryService}/>, ...menu },
      handoff: { message: assistantAnswers.handoff, component: <InquiryLink onInquire={setInquiryService}/>, ...menu },
      fallback: { message: 'This guide covers our published services. For a custom question, send an inquiry for the team to review.', component: <InquiryLink onInquire={setInquiryService}/>, ...menu },
    };
    services.forEach((service, index) => { result[`service_${index}`] = { message: assistantServiceAnswer(service), component: <InquiryLink service={service} onInquire={setInquiryService}/>, ...menu }; });
    return result;
  }, [services]);

  if (inquiryService !== null) return <div className="assistant-inquiry"><button type="button" className="button button-secondary" onClick={() => setInquiryService(null)}>Back to service guide</button><h3>Review your project inquiry</h3><p className="muted">Share the outcome you need and your desired timeline. Submitting saves your contact details and brief in AgencyDesk so the team can review them. Optional update permissions start unchecked.</p><InquiryForm available={available} services={services} initialService={inquiryService} intakeSource="website_chatbot"/></div>;
  return <div className="assistant-chat"><ChatBot id="agencydesk-services" flow={flow} settings={settings} styles={styles}/><p className="assistant-note">No live agent or automatic quote. <Link href="/inquire">Use the inquiry form</Link> anytime.</p></div>;
}
