// Where a sign-in may send people afterwards. Exact paths only: no open redirects.
const ALLOWED = ['/signup?intent=creator', '/signup?intent=client', '/dashboard', '/apply', '/application-status', '/onboarding', '/inbox', '/saved', '/billing', '/admin']

export function safeNext(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next) return fallback
  return ALLOWED.includes(next) ? next : fallback
}

// After Google, people come back to sign-up to give their name and date of birth (asked once).
export function nextForIntent(intent: string | null | undefined): string {
  return intent === 'creator' ? '/signup?intent=creator' : '/signup?intent=client'
}
