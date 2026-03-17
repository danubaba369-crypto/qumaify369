import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, environment variables might be missing.
    // Return a dummy object or handle gracefully to avoid crashing.
    if (typeof window === 'undefined') {
      console.warn('Supabase credentials missing during server-side execution (likely build time).')
    }
    // We return createBrowserClient still, but it will error only when called if vars are missing
    // Actually, createBrowserClient might throw immediately. Let's be safer.
  }

  return createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
  )
}
