import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export interface AdminUser {
  id: string
  email: string
  role: string
  first_name?: string
  last_name?: string
}

/**
 * Require admin authentication for API routes
 * @param request NextRequest object
 * @returns Promise<AdminUser> if authenticated
 * @throws Error if not authenticated or not admin
 */
export async function requireAdminAuth(request?: NextRequest): Promise<AdminUser> {
  const supabase = createRouteHandlerSupabaseClient(request)

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Authentication required')
  }

  // Check if user has admin role in metadata
  const userRole = user.user_metadata?.role || user.app_metadata?.role

  // First check metadata for quick access
  if (['admin', 'manager', 'staff'].includes(userRole)) {
    return {
      id: user.id,
      email: user.email!,
      role: userRole,
      first_name: user.user_metadata?.first_name,
      last_name: user.user_metadata?.last_name
    }
  }

  // Check admin_users table if metadata check fails
  try {
    const { data: adminRecord, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (error || !adminRecord) {
      throw new Error('Admin access required')
    }

    return {
      id: user.id,
      email: user.email!,
      role: adminRecord.role || 'staff',
      first_name: adminRecord.first_name,
      last_name: adminRecord.last_name
    }
  } catch (error) {
    // If admin table doesn't exist or isn't accessible, deny access
    throw new Error('Admin access required')
  }
}

/**
 * Check if user has specific permission
 * @param user AdminUser
 * @param permission string
 * @returns boolean
 */
export function hasPermission(user: AdminUser, permission: string): boolean {
  // Admin has all permissions
  if (user.role === 'admin') {
    return true
  }

  // Manager has most permissions
  if (user.role === 'manager') {
    const managerPermissions = [
      'products.read',
      'products.create',
      'products.update',
      'orders.read',
      'orders.update',
      'inquiries.read',
      'inquiries.update',
      'customers.read'
    ]
    return managerPermissions.includes(permission)
  }

  // Staff has limited permissions
  if (user.role === 'staff') {
    const staffPermissions = [
      'products.read',
      'orders.read',
      'inquiries.read',
      'inquiries.update'
    ]
    return staffPermissions.includes(permission)
  }

  return false
}

/**
 * Require specific permission for an action
 * @param user AdminUser
 * @param permission string
 * @throws Error if permission denied
 */
export function requirePermission(user: AdminUser, permission: string): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
}