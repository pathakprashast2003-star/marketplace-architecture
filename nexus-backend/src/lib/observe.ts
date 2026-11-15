// Error reporting. Never put personal data (emails, names, message text) in what is reported.
// To send to Sentry: run `npx @sentry/wizard@latest -i nextjs`, then call Sentry.captureException here.
export function report(error: unknown, where: string, extra: Record<string, string | number | boolean | null> = {}) {
  const e = error instanceof Error ? error : new Error(String(error))
  console.error(JSON.stringify({ level: 'error', where, name: e.name, message: scrub(e.message), ...extra }))
}

export function scrub(s: string): string {
  return s
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b(sk|rk|whsec|re)_[A-Za-z0-9_]{8,}/g, '[secret]')
    .slice(0, 500)
}
