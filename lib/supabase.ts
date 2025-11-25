import { createClient } from "@supabase/supabase-js"

function getEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback
  if (!value) {
    throw new Error(`${name} is required but was not provided`)
  }
  return value
}

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL")
const supabaseAnonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
const supabaseServiceRoleKey = getEnv(
  "SUPABASE_SERVICE_ROLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
)

// Singleton client for client-side
let clientInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return clientInstance
}

// Server-side client (creates new instance each time for isolation)
export function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey)
}
