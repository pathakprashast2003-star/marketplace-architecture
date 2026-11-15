// Test-only settings (not real secrets).
Object.assign(process.env, {
  APP_URL: 'https://nexus.test',
  ALLOWED_ORIGINS: 'https://landing.nexus.test',
  NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-anon-key-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key-service-key-service',
  STRIPE_SECRET_KEY: 'sk_test_x',
  STRIPE_WEBHOOK_SECRET: 'whsec_test',
  STRIPE_PRICE_ID: 'price_x',
  RESEND_API_KEY: 're_test_key_123',
  EMAIL_FROM_ACCOUNT: 'Nexus <hello@mail.nexus.test>',
  EMAIL_FROM_INQUIRY: 'Nexus <inbox@msg.nexus.test>',
  CRON_SECRET: 'cron-secret-cron-secret-cron-secret',
  HASH_SECRET: 'hash-secret-hash-secret-hash-secret',
})
