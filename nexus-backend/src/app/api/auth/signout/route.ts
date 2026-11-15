import { json, route } from '@/lib/http'
import { serverClient } from '@/lib/supabase-server'

export const POST = route(async () => {
  const supabase = await serverClient()
  await supabase.auth.signOut()
  return json({ ok: true })
})
