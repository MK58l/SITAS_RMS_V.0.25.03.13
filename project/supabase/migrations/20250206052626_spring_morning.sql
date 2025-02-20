/*
  # Fix tables and add sample data

  1. Changes
    - Drop and recreate tables table with proper UUID handling
    - Add sample tables with proper UUIDs
    - Update foreign key constraints
  
  2. Security
    - Maintain existing RLS policies
*/

-- Recreate tables table with proper structure
DROP TABLE IF EXISTS tables CASCADE;

CREATE TABLE tables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number integer UNIQUE NOT NULL,
    capacity integer NOT NULL,
    status text NOT NULL DEFAULT 'available' 
        CHECK (status IN ('available', 'reserved', 'occupied', 'cleaning')),
    is_reserved boolean DEFAULT false,
    qr_code text NOT NULL,
    current_order_id uuid,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Anyone can view tables"
    ON tables FOR SELECT
    USING (true);

CREATE POLICY "Staff and admin can manage tables"
    ON tables FOR ALL
    USING (auth.jwt()->>'role' IN ('staff', 'admin'));

-- Insert sample tables with proper UUIDs
INSERT INTO tables (table_number, capacity, status, is_reserved, qr_code) VALUES
(1, 2, 'available', false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_1'),
(2, 2, 'available', false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_2'),
(3, 4, 'available', false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_3'),
(4, 4, 'available', false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_4'),
(5, 6, 'available', false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_5'),
(6, 6, 'available', false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_6'),
(7, 8, 'available', false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_7'),
(8, 8, 'available', false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_8');

-- Ensure reservations table has correct foreign key
ALTER TABLE reservations 
    DROP CONSTRAINT IF EXISTS reservations_table_id_fkey,
    ADD CONSTRAINT reservations_table_id_fkey 
    FOREIGN KEY (table_id) 
    REFERENCES tables(id)
    ON DELETE CASCADE;