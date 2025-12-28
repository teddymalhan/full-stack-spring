import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

export async function initializeSupabase() {
  if (supabase) {
    return supabase
  }

  try {
    // Fetch config from backend (includes Supabase URL and anon key)
    const response = await fetch('/config')
    const config = await response.json()

    // Initialize Supabase client
    supabase = createClient(
      config.supabaseUrl || import.meta.env.VITE_SUPABASE_URL,
      config.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY
    )

    return supabase
  } catch (error) {
    console.error('Failed to initialize Supabase:', error)
    throw error
  }
}

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase not initialized. Call initializeSupabase() first.')
  }
  return supabase
}

// Export for convenience
export { supabase }
