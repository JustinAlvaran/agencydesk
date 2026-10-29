import type { Service } from './service-catalog';

export type AssistantService = Pick<Service, 'id' | 'title' | 'description' | 'bullet_1' | 'bullet_2' | 'bullet_3'>;
export const assistantTopics = ['Explore services', 'How projects work', 'Pricing and timing', 'Request a follow-up'];
export const assistantAnswers = {
  process: 'Share your requirements, budget and desired timeline. The team reviews your inquiry and agrees on scope and pricing in a proposal before work begins. Accepted proposals connect to a project and private client portal.',
  pricing: 'Pricing and delivery dates depend on the agreed scope. This guide cannot provide a quote or promise a completion date. Share your budget and desired timeline in an inquiry so the team can review them.',
  handoff: 'You can request a follow-up by submitting a project inquiry. This is not a live support inbox. Your contact details are saved only when you submit the form; email and WhatsApp updates are separate optional choices.',
};

export function assistantServiceAnswer(service: AssistantService) {
  return `${service.description}\n\nScope can include:\n• ${service.bullet_1}\n• ${service.bullet_2}\n• ${service.bullet_3}`;
}
