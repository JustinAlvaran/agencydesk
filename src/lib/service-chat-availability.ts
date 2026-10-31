import 'server-only';
import {isDemo} from './env';
export function serviceChatAvailable(): boolean {
  return !isDemo() && process.env.SERVICE_CHAT_ENABLED === 'true'
    && (process.env.SERVICE_CHAT_RELAY_KEY?.length ?? 0) >= 32;
}
