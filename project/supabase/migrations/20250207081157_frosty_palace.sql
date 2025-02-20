/*
  # Fix staff_shifts foreign key relationship

  1. Changes
    - Drop and recreate staff_shifts table with proper foreign key
    - Update RLS policies
  
  2. Security
    - Maintain existing RLS policies
    - Ensure proper foreign key constraints
*/

-- Recreate staff_shifts table with proper structure
DROP TABLE IF EXISTS staff_shifts CASCADE;

CREATE TABLE staff_shifts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    status text NOT NULL CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff and admin can view shifts"
    ON staff_shifts FOR SELECT
    USING (auth.jwt()->>'role' IN ('staff', 'admin'));

CREATE POLICY "Admin can manage shifts"
    ON staff_shifts FOR ALL
    USING (auth.jwt()->>'role' = 'admin');