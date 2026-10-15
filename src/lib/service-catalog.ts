import type { WebsiteContent } from './website-schema';

export type Service = WebsiteContent['services'][number];
export const undecidedService = 'Not sure yet';

export function visibleServices(services: Service[]): Service[] {
  return services.filter(service => service.visibility === 'visible').sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id));
}

export function inquiryService(services: Service[], id: string | string[] | undefined): string {
  return typeof id === 'string' ? visibleServices(services).find(service => service.id === id)?.title ?? '' : '';
}
