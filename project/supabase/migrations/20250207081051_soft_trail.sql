/*
  # Fix table_status_history RLS policies

  1. Changes
    - Update RLS policies to allow authenticated users to insert records
    - Maintain existing admin/staff policies
    - Fix syntax for UPDATE and DELETE policies
  
  2. Security
    - Allow authenticated users to insert records
    - Maintain view restrictions
    - Separate UPDATE and DELETE policies for proper syntax
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Staff and admin can view table history" ON table_status_history;
DROP POLICY IF EXISTS "Staff and admin can manage table history" ON table_status_history;

-- Create new policies
CREATE POLICY "Anyone can view table history"
    ON table_status_history FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert table history"
    ON table_status_history FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff and admin can update table history"
    ON table_status_history FOR UPDATE
    USING (auth.jwt()->>'role' IN ('staff', 'admin'));

CREATE POLICY "Staff and admin can delete table history"
    ON table_status_history FOR DELETE
    USING (auth.jwt()->>'role' IN ('staff', 'admin'));