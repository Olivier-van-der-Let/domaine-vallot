-- Migration: Create admin_users table
-- Created: 2025-09-26

-- Create admin_users table (extends auth.users for admin privileges)
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    permissions TEXT[], -- Array of permission strings
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin_users
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX idx_admin_users_created_at ON admin_users(created_at);

-- Create trigger for admin_users updated_at
CREATE TRIGGER trigger_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert the initial admin user (oliviervanderlet@gmail.com)
-- First get the user_id from auth.users
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Find the user by email
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'oliviervanderlet@gmail.com';

    -- If user exists, add them as admin
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO admin_users (user_id, role, first_name, last_name, is_active, created_at)
        VALUES (
            admin_user_id,
            'admin',
            'Olivier',
            'Vanderlet',
            TRUE,
            NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            role = EXCLUDED.role,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

        RAISE NOTICE 'Admin user oliviervanderlet@gmail.com has been added/updated';
    ELSE
        RAISE NOTICE 'User oliviervanderlet@gmail.com not found in auth.users table';
    END IF;
END $$;

-- Create RLS policies for admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can read all admin records
CREATE POLICY "Admin users can read all admin records" ON admin_users
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = TRUE
        )
    );

-- Policy: Admin users can update their own record
CREATE POLICY "Admin users can update their own record" ON admin_users
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy: Only admin role can insert/delete admin users
CREATE POLICY "Only admin role can manage admin users" ON admin_users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.role = 'admin'
            AND au.is_active = TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.role = 'admin'
            AND au.is_active = TRUE
        )
    );

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = check_user_id
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get admin role
CREATE OR REPLACE FUNCTION get_admin_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM admin_users
    WHERE user_id = check_user_id AND is_active = TRUE;

    RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON admin_users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;