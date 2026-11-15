import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from './env'

/** A client that acts as the signed-in visitor (cookies), with row-level security applied. */
export async function serverClient() {
  const store = await cookies()
  return createServerClient(env().NEXT_PUBLIC_SUPABASE_URL, env().NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options)
        } catch {
          // called from a place that cannot set cookies (e.g. a server component): safe to ignore
        }
      },
    },
  })
}
