/*
  # Add staff management and additional features

  1. New Tables
    - staff_shifts: Track staff work schedules
    - revenue_transactions: Track all financial transactions
    - table_status_history: Track table status changes

  2. Sample Data
    - Add admin and staff users
    - Add initial shifts

  3. Security
    - Add RLS policies for new tables
    - Update existing policies
*/

-- Create new tables
CREATE TABLE IF NOT EXISTS staff_shifts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    status text NOT NULL CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    notes text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revenue_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders,
    amount decimal(10,2) NOT NULL,
    type text NOT NULL CHECK (type IN ('order', 'refund', 'adjustment')),
    payment_method text NOT NULL,
    status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    processed_by uuid REFERENCES auth.users,
    notes text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS table_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id uuid REFERENCES tables NOT NULL,
    status text NOT NULL CHECK (status IN ('available', 'reserved', 'occupied', 'cleaning')),
    changed_by uuid REFERENCES auth.users NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Add status column to tables
ALTER TABLE tables ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'available' 
    CHECK (status IN ('available', 'reserved', 'occupied', 'cleaning'));

-- Enable RLS
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for staff_shifts
CREATE POLICY "Staff can view their own shifts"
    ON staff_shifts FOR SELECT
    USING (user_id = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'staff'));

CREATE POLICY "Admin can manage all shifts"
    ON staff_shifts FOR ALL
    USING (auth.jwt()->>'role' = 'admin');

-- Create policies for revenue_transactions
CREATE POLICY "Staff and admin can view transactions"
    ON revenue_transactions FOR SELECT
    USING (auth.jwt()->>'role' IN ('admin', 'staff'));

CREATE POLICY "Admin can manage transactions"
    ON revenue_transactions FOR ALL
    USING (auth.jwt()->>'role' = 'admin');

-- Create policies for table_status_history
CREATE POLICY "Staff and admin can view table history"
    ON table_status_history FOR SELECT
    USING (auth.jwt()->>'role' IN ('admin', 'staff'));

CREATE POLICY "Staff and admin can add table history"
    ON table_status_history FOR INSERT
    WITH CHECK (auth.jwt()->>'role' IN ('admin', 'staff'));

-- Insert admin and staff users
DO $$ 
DECLARE 
    admin_id uuid;
    staff_id1 uuid;
    staff_id2 uuid;
BEGIN
    -- Create admin user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@restaurant.com',
        crypt('admin123', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"], "role": "admin"}',
        '{"name": "Restaurant Admin", "role": "admin"}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO admin_id;

    -- Create staff users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'staff1@restaurant.com',
        crypt('staff123', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"], "role": "staff"}',
        '{"name": "Staff Member 1", "role": "staff"}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO staff_id1;

    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'staff2@restaurant.com',
        crypt('staff123', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"], "role": "staff"}',
        '{"name": "Staff Member 2", "role": "staff"}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO staff_id2;

    -- Add initial staff shifts
    INSERT INTO staff_shifts (user_id, start_time, end_time, status, notes)
    VALUES
        (staff_id1, now(), now() + interval '8 hours', 'active', 'Morning shift'),
        (staff_id2, now() + interval '8 hours', now() + interval '16 hours', 'scheduled', 'Evening shift');

END $$;