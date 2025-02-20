/*
  # Fix Database Schema Issues

  1. Changes
    - Fix staff_shifts foreign key relationship
    - Fix table_status_history RLS policies
    - Fix reservations date/time columns
    - Add missing indexes
    - Update RLS policies

  2. Security
    - Update RLS policies for proper access
*/

-- Fix staff_shifts table
ALTER TABLE staff_shifts DROP CONSTRAINT IF EXISTS staff_shifts_user_id_fkey;
ALTER TABLE staff_shifts 
    ADD CONSTRAINT staff_shifts_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id);

-- Fix table_status_history policies
DROP POLICY IF EXISTS "Staff and admin can add table history" ON table_status_history;
CREATE POLICY "Staff and admin can manage table history"
    ON table_status_history
    FOR ALL
    USING (auth.jwt()->>'role' IN ('staff', 'admin'))
    WITH CHECK (auth.jwt()->>'role' IN ('staff', 'admin'));

-- Fix reservations table
DO $$ 
BEGIN
    -- Drop old columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'date') THEN
        ALTER TABLE reservations DROP COLUMN date;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'time') THEN
        ALTER TABLE reservations DROP COLUMN time;
    END IF;
    
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'reservation_date') THEN
        ALTER TABLE reservations ADD COLUMN reservation_date date;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'reservation_time') THEN
        ALTER TABLE reservations ADD COLUMN reservation_time time;
    END IF;
END $$;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_staff_shifts_user_id ON staff_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_table_status_history_table_id ON table_status_history(table_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);

-- Update RLS policies for proper access
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view their own shifts" ON staff_shifts;
DROP POLICY IF EXISTS "Admin can manage all shifts" ON staff_shifts;

CREATE POLICY "Staff and admin can view shifts"
    ON staff_shifts FOR SELECT
    USING (auth.jwt()->>'role' IN ('staff', 'admin'));

CREATE POLICY "Admin can manage shifts"
    ON staff_shifts FOR ALL
    USING (auth.jwt()->>'role' = 'admin');