/** Original geometric A; a separate face identifies the service guide. */
export function BrandMark({ size = 32, bot = false }: { size?: number; bot?: boolean }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
    {bot ? <><rect x="1" y="1" width="30" height="30" rx="12" fill="currentColor"/><path d="M10 19c2 3 10 3 12-1" stroke="white" strokeWidth="2" strokeLinecap="round"/><circle cx="11" cy="12" r="2" fill="white"/><circle cx="21" cy="12" r="2" fill="white"/></> : <path d="M6 25 16 6l10 19M10.5 16h11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>}
  </svg>;
}
