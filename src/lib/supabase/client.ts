import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database.types'

// Create a singleton instance of the Supabase client for browser usage
export const createClientComponentClient = () =>
  createBrowserSupabaseClient<Database>()

// Export with the expected name for compatibility
export const createClient = createClientComponentClient

// Export a default client instance
export const supabase = createClientComponentClient()

// Type helpers
export type SupabaseClient = ReturnType<typeof createClientComponentClient>

// Database table types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types
export type WineProduct = Tables<'wine_products'>
export type Customer = Tables<'customers'>
export type CustomerAddress = Tables<'customer_addresses'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type CartItem = Tables<'cart_items'>
export type VatRate = Tables<'vat_rates'>
export type WineCertification = Tables<'wine_certifications'>
export type ContentPage = Tables<'content_pages'>

// Utility functions for common operations
export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })
  if (error) throw error
  return data
}

// Real-time subscription helpers
export const subscribeToTableChanges = <T extends keyof Database['public']['Tables']>(
  table: T,
  callback: (payload: any) => void,
  filter?: string
) => {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Error handling helper
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)

  if (error?.code === 'PGRST116') {
    throw new Error('Resource not found')
  }

  if (error?.code === '23505') {
    throw new Error('This record already exists')
  }

  if (error?.code === '42501') {
    throw new Error('Access denied')
  }

  if (error?.message) {
    throw new Error(error.message)
  }

  throw new Error('An unexpected error occurred')
}