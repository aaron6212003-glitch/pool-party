import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Only return a dummy during build-time server-side pre-rendering
  // In the browser, we want it to fail early if missing
  if (typeof window === 'undefined' && (!url || !key)) {
    return {} as any
  }

  return createBrowserClient(
    url,
    key,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  )
}
