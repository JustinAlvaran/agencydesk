export function publicURL(path: string): string {
  return new URL(path, process.env.APP_URL || 'http://localhost:3000').href;
}
