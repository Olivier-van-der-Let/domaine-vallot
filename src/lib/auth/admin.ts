import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

export type AdminRole = 'admin' | 'super_admin' | 'moderator';
export type AdminPermission =
  | 'products.read'
  | 'products.write'
  | 'products.delete'
  | 'orders.read'
  | 'orders.write'
  | 'orders.delete'
  | 'customers.read'
  | 'customers.write'
  | 'customers.delete'
  | 'analytics.read'
  | 'settings.read'
  | 'settings.write'
  | 'users.read'
  | 'users.write'
  | 'users.delete'
  | 'sync.meta'
  | 'sync.google'
  | 'emails.send'
  | 'inventory.write';

export interface AdminUser extends User {
  profile?: {
    role: AdminRole;
    permissions: AdminPermission[];
    is_active: boolean;
    last_login: string;
    created_at: string;
    updated_at: string;
  };
}

export interface AuthenticationResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
  redirect?: string;
}

export interface AuthorizationResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
  missingPermissions?: AdminPermission[];
}

// Default role permissions
const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  moderator: [
    'products.read',
    'orders.read',
    'customers.read',
    'analytics.read',
  ],
  admin: [
    'products.read',
    'products.write',
    'products.delete',
    'orders.read',
    'orders.write',
    'customers.read',
    'customers.write',
    'analytics.read',
    'settings.read',
    'settings.write',
    'sync.meta',
    'sync.google',
    'emails.send',
    'inventory.write',
  ],
  super_admin: [
    'products.read',
    'products.write',
    'products.delete',
    'orders.read',
    'orders.write',
    'orders.delete',
    'customers.read',
    'customers.write',
    'customers.delete',
    'analytics.read',
    'settings.read',
    'settings.write',
    'users.read',
    'users.write',
    'users.delete',
    'sync.meta',
    'sync.google',
    'emails.send',
    'inventory.write',
  ],
};

export class AdminAuth {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Authenticate a user and check if they have admin privileges
   */
  async authenticate(): Promise<AuthenticationResult> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();

      if (authError) {
        return {
          success: false,
          error: 'Authentication failed',
          redirect: '/auth/login?redirect=/admin',
        };
      }

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          redirect: '/auth/login?redirect=/admin',
        };
      }

      // Get user profile with admin role
      const { data: profile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('role, permissions, is_active, last_login, created_at, updated_at')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        return {
          success: false,
          error: 'User profile not found',
          redirect: '/auth/login?redirect=/admin',
        };
      }

      // Check if user is an admin
      if (!this.isAdminRole(profile.role)) {
        return {
          success: false,
          error: 'Insufficient privileges - Admin access required',
          redirect: '/',
        };
      }

      // Check if user account is active
      if (!profile.is_active) {
        return {
          success: false,
          error: 'Account is deactivated',
          redirect: '/auth/login?error=account_deactivated',
        };
      }

      // Update last login timestamp
      await this.updateLastLogin(user.id);

      const adminUser: AdminUser = {
        ...user,
        profile: {
          role: profile.role,
          permissions: profile.permissions || ROLE_PERMISSIONS[profile.role] || [],
          is_active: profile.is_active,
          last_login: profile.last_login,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        },
      };

      return {
        success: true,
        user: adminUser,
      };
    } catch (error) {
      console.error('Admin authentication error:', error);
      return {
        success: false,
        error: 'Internal authentication error',
      };
    }
  }

  /**
   * Check if a user has specific permissions
   */
  async authorize(requiredPermissions: AdminPermission | AdminPermission[]): Promise<AuthorizationResult> {
    const authResult = await this.authenticate();

    if (!authResult.success || !authResult.user) {
      return {
        success: false,
        error: authResult.error,
      };
    }

    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    const userPermissions = authResult.user.profile?.permissions || [];

    const missingPermissions = permissions.filter(
      permission => !userPermissions.includes(permission)
    );

    if (missingPermissions.length > 0) {
      return {
        success: false,
        user: authResult.user,
        error: 'Insufficient permissions',
        missingPermissions,
      };
    }

    return {
      success: true,
      user: authResult.user,
    };
  }

  /**
   * Middleware for protecting admin routes
   */
  async middleware(
    request: NextRequest,
    requiredPermissions?: AdminPermission | AdminPermission[]
  ): Promise<NextResponse | null> {
    try {
      if (requiredPermissions) {
        const authResult = await this.authorize(requiredPermissions);

        if (!authResult.success) {
          if (authResult.error === 'Insufficient permissions') {
            return NextResponse.json(
              {
                error: 'Forbidden - Insufficient permissions',
                required: requiredPermissions,
                missing: authResult.missingPermissions,
              },
              { status: 403 }
            );
          }

          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
      } else {
        const authResult = await this.authenticate();

        if (!authResult.success) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
      }

      // Authentication successful, continue to the route
      return null;
    } catch (error) {
      console.error('Admin middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * Create a new admin user
   */
  async createAdminUser(
    email: string,
    password: string,
    role: AdminRole,
    customPermissions?: AdminPermission[]
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      // Only super_admin can create new admin users
      const authResult = await this.authorize('users.write');

      if (!authResult.success) {
        return {
          success: false,
          error: 'Insufficient permissions to create admin users',
        };
      }

      // Create user in Supabase Auth
      const { data: authData, error: createError } = await this.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError || !authData.user) {
        return {
          success: false,
          error: createError?.message || 'Failed to create user',
        };
      }

      // Create user profile
      const permissions = customPermissions || ROLE_PERMISSIONS[role] || [];

      const { data: profile, error: profileError } = await this.supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          email: authData.user.email,
          role,
          permissions,
          is_active: true,
          created_by: authResult.user?.id,
        })
        .select('role, permissions, is_active, last_login, created_at, updated_at')
        .single();

      if (profileError) {
        // Clean up the auth user if profile creation fails
        await this.supabase.auth.admin.deleteUser(authData.user.id);

        return {
          success: false,
          error: 'Failed to create user profile',
        };
      }

      const adminUser: AdminUser = {
        ...authData.user,
        profile,
      };

      return {
        success: true,
        user: adminUser,
      };
    } catch (error) {
      console.error('Create admin user error:', error);
      return {
        success: false,
        error: 'Internal error creating admin user',
      };
    }
  }

  /**
   * Update admin user role and permissions
   */
  async updateAdminUser(
    userId: string,
    updates: {
      role?: AdminRole;
      permissions?: AdminPermission[];
      is_active?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const authResult = await this.authorize('users.write');

      if (!authResult.success) {
        return {
          success: false,
          error: 'Insufficient permissions to update admin users',
        };
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
        updated_by: authResult.user?.id,
      };

      if (updates.role !== undefined) {
        updateData.role = updates.role;
        // If role is being updated and no custom permissions provided, use default role permissions
        if (updates.permissions === undefined) {
          updateData.permissions = ROLE_PERMISSIONS[updates.role] || [];
        }
      }

      if (updates.permissions !== undefined) {
        updateData.permissions = updates.permissions;
      }

      if (updates.is_active !== undefined) {
        updateData.is_active = updates.is_active;
      }

      const { error } = await this.supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Update admin user error:', error);
      return {
        success: false,
        error: 'Internal error updating admin user',
      };
    }
  }

  /**
   * Get all admin users
   */
  async getAdminUsers(): Promise<{ success: boolean; users?: AdminUser[]; error?: string }> {
    try {
      const authResult = await this.authorize('users.read');

      if (!authResult.success) {
        return {
          success: false,
          error: 'Insufficient permissions to view admin users',
        };
      }

      const { data: profiles, error } = await this.supabase
        .from('user_profiles')
        .select(`
          user_id,
          email,
          role,
          permissions,
          is_active,
          last_login,
          created_at,
          updated_at
        `)
        .in('role', ['admin', 'super_admin', 'moderator'])
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const users: AdminUser[] = profiles?.map(profile => ({
        id: profile.user_id,
        email: profile.email,
        profile,
      } as AdminUser)) || [];

      return {
        success: true,
        users,
      };
    } catch (error) {
      console.error('Get admin users error:', error);
      return {
        success: false,
        error: 'Internal error fetching admin users',
      };
    }
  }

  /**
   * Log admin action for audit trail
   */
  async logAdminAction(
    action: string,
    details?: any,
    userId?: string
  ): Promise<void> {
    try {
      const authResult = await this.authenticate();
      const actorId = userId || authResult.user?.id;

      if (!actorId) return;

      await this.supabase
        .from('admin_audit_log')
        .insert({
          user_id: actorId,
          action,
          details: details || {},
          ip_address: this.getClientIP(),
          user_agent: this.getUserAgent(),
        });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  private isAdminRole(role: string): role is AdminRole {
    return ['admin', 'super_admin', 'moderator'].includes(role);
  }

  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.supabase
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  private getClientIP(): string | null {
    // This would be implemented based on your deployment environment
    // For Vercel, you might use request headers like x-forwarded-for
    return null;
  }

  private getUserAgent(): string | null {
    // This would be implemented based on your deployment environment
    return null;
  }
}

// Singleton instance
let adminAuthInstance: AdminAuth | null = null;

export const getAdminAuth = (): AdminAuth => {
  if (!adminAuthInstance) {
    adminAuthInstance = new AdminAuth();
  }
  return adminAuthInstance;
};

// Convenience functions
export const authenticateAdmin = () => getAdminAuth().authenticate();
export const authorizeAdmin = (permissions: AdminPermission | AdminPermission[]) =>
  getAdminAuth().authorize(permissions);
export const adminMiddleware = (request: NextRequest, permissions?: AdminPermission | AdminPermission[]) =>
  getAdminAuth().middleware(request, permissions);
export const logAdminAction = (action: string, details?: any, userId?: string) =>
  getAdminAuth().logAdminAction(action, details, userId);

// Higher-order function for protecting API routes
export function withAdminAuth(
  handler: (request: NextRequest, user: AdminUser) => Promise<NextResponse>,
  requiredPermissions?: AdminPermission | AdminPermission[]
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const adminAuth = getAdminAuth();

    const middlewareResponse = await adminAuth.middleware(request, requiredPermissions);
    if (middlewareResponse) {
      return middlewareResponse;
    }

    const authResult = await adminAuth.authenticate();
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(request, authResult.user);
  };
}

// React hook for client-side admin authentication
export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/admin/me');

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setError('Not authenticated as admin');
        }
      } catch (err) {
        setError('Failed to check authentication');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const hasPermission = (permission: AdminPermission): boolean => {
    return user?.profile?.permissions.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: AdminPermission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: AdminPermission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    role: user?.profile?.role,
  };
}