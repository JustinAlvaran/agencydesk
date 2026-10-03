import 'server-only';

// Never log user inputs, tokens, invitation links, or database messages.
export function reportFailure(operation: string, error: unknown) {
  const value = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  console.error('[agencydesk] operation failed', {
    operation,
    code: /^[A-Z0-9_]{1,30}$/.test(value) ? value : 'UNEXPECTED',
  });
}
