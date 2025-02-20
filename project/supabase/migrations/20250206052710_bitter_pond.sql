/*
  # Fix reservations table user reference

  1. Changes
    - Drop and recreate reservations table with correct auth.users reference
    - Update foreign key constraints
  
  2. Security
    - Maintain existing RLS policies
*/

-- Recreate reservations table with proper references
DROP TABLE IF EXISTS reservations CASCADE;

CREATE TABLE reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id uuid REFERENCES tables(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_date date NOT NULL,
    reservation_time time NOT NULL,
    duration integer NOT NULL DEFAULT 120, -- 2 hours default
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can view their reservations"
    ON reservations FOR SELECT
    USING (user_id = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'staff'));

CREATE POLICY "Users can create reservations"
    ON reservations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their reservations"
    ON reservations FOR UPDATE
    USING (user_id = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'staff'));

CREATE POLICY "Users can delete their reservations"
    ON reservations FOR DELETE
    USING (user_id = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'staff'));