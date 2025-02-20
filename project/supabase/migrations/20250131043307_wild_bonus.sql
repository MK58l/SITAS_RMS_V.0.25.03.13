/*
  # Update Schema for Restaurant Management System

  This migration safely creates tables if they don't exist and adds policies.
  
  1. Tables
    - Checks for existence before creation
    - Uses IF NOT EXISTS for all tables
  
  2. Security
    - Enables RLS
    - Adds appropriate policies for each role
*/

-- Create tables if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tables' AND schemaname = 'public') THEN
        CREATE TABLE public.tables (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            table_number integer UNIQUE NOT NULL,
            capacity integer NOT NULL,
            is_reserved boolean DEFAULT false,
            qr_code text NOT NULL,
            current_order_id uuid,
            created_at timestamptz DEFAULT now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'reservations' AND schemaname = 'public') THEN
        CREATE TABLE public.reservations (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            table_id uuid REFERENCES public.tables,
            user_id uuid REFERENCES auth.users,
            date date NOT NULL,
            time time NOT NULL,
            duration integer NOT NULL,
            created_at timestamptz DEFAULT now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'menu_items' AND schemaname = 'public') THEN
        CREATE TABLE public.menu_items (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            name text NOT NULL,
            description text,
            price decimal(10,2) NOT NULL,
            category text NOT NULL,
            image_url text,
            is_available boolean DEFAULT true,
            created_at timestamptz DEFAULT now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'orders' AND schemaname = 'public') THEN
        CREATE TABLE public.orders (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            table_id uuid REFERENCES public.tables,
            user_id uuid REFERENCES auth.users,
            status text NOT NULL DEFAULT 'pending',
            total_amount decimal(10,2) NOT NULL,
            payment_status text NOT NULL DEFAULT 'pending',
            payment_method text,
            created_at timestamptz DEFAULT now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'order_items' AND schemaname = 'public') THEN
        CREATE TABLE public.order_items (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id uuid REFERENCES public.orders,
            menu_item_id uuid REFERENCES public.menu_items,
            quantity integer NOT NULL,
            price decimal(10,2) NOT NULL,
            created_at timestamptz DEFAULT now()
        );
    END IF;
END $$;

-- Enable Row Level Security (idempotent operations, safe to repeat)
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DO $$ 
BEGIN
    -- Tables policies
    DROP POLICY IF EXISTS "Public read access to tables" ON public.tables;
    DROP POLICY IF EXISTS "Staff and admin can manage tables" ON public.tables;
    
    CREATE POLICY "Public read access to tables" ON public.tables
        FOR SELECT TO authenticated USING (true);
    
    CREATE POLICY "Staff and admin can manage tables" ON public.tables
        FOR ALL TO authenticated
        USING (auth.jwt() ->> 'role' IN ('staff', 'admin'));

    -- Reservations policies
    DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;
    DROP POLICY IF EXISTS "Staff and admin can manage reservations" ON public.reservations;
    
    CREATE POLICY "Users can view their own reservations" ON public.reservations
        FOR SELECT TO authenticated
        USING (auth.uid() = user_id);
    
    CREATE POLICY "Staff and admin can manage reservations" ON public.reservations
        FOR ALL TO authenticated
        USING (auth.jwt() ->> 'role' IN ('staff', 'admin'));

    -- Menu items policies
    DROP POLICY IF EXISTS "Public read access to menu items" ON public.menu_items;
    DROP POLICY IF EXISTS "Admin can manage menu items" ON public.menu_items;
    
    CREATE POLICY "Public read access to menu items" ON public.menu_items
        FOR SELECT TO authenticated USING (true);
    
    CREATE POLICY "Admin can manage menu items" ON public.menu_items
        FOR ALL TO authenticated
        USING (auth.jwt() ->> 'role' = 'admin');

    -- Orders policies
    DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
    DROP POLICY IF EXISTS "Staff and admin can manage orders" ON public.orders;
    
    CREATE POLICY "Users can view their own orders" ON public.orders
        FOR SELECT TO authenticated
        USING (auth.uid() = user_id);
    
    CREATE POLICY "Staff and admin can manage orders" ON public.orders
        FOR ALL TO authenticated
        USING (auth.jwt() ->> 'role' IN ('staff', 'admin'));

    -- Order items policies
    DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
    DROP POLICY IF EXISTS "Staff and admin can manage order items" ON public.order_items;
    
    CREATE POLICY "Users can view their own order items" ON public.order_items
        FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.orders
                WHERE orders.id = order_items.order_id
                AND orders.user_id = auth.uid()
            )
        );
    
    CREATE POLICY "Staff and admin can manage order items" ON public.order_items
        FOR ALL TO authenticated
        USING (auth.jwt() ->> 'role' IN ('staff', 'admin'));
END $$;