import { createAutomationWorker } from '../_shared/automation-worker.ts';
import { createAutomationBackend } from '../_shared/automation-backend.ts';
import { deliverMessage, secretMatches } from '../_shared/delivery.ts';

Deno.serve(createAutomationWorker({
  env: name => Deno.env.get(name), createBackend: createAutomationBackend,
  deliver: deliverMessage, matches: secretMatches, policy: 'configured',
}));
