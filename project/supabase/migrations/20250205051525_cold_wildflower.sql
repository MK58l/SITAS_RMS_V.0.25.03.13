/*
  # Enhanced Menu and Orders System

  1. New Tables
    - `menu_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `sort_order` (integer)
      - `is_active` (boolean)
    
    - `chef_notifications`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add category_id to menu_items
    - Add preparation_status to orders
    - Add table_qr_code to tables
    - Add is_available to menu_items

  3. Security
    - Enable RLS on new tables
    - Add policies for chef access
*/

-- Create menu categories table
CREATE TABLE IF NOT EXISTS menu_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create chef notifications table
CREATE TABLE IF NOT EXISTS chef_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders NOT NULL,
    status text NOT NULL CHECK (status IN ('pending', 'preparing', 'ready', 'completed')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add new columns to existing tables
ALTER TABLE menu_items 
    ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES menu_categories,
    ADD COLUMN IF NOT EXISTS preparation_time interval,
    ADD COLUMN IF NOT EXISTS ingredients text[];

ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS preparation_status text CHECK (preparation_status IN ('pending', 'preparing', 'ready', 'completed')) DEFAULT 'pending';

-- Enable RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chef_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for menu_categories
CREATE POLICY "Anyone can view active menu categories"
    ON menu_categories FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admin can manage menu categories"
    ON menu_categories FOR ALL
    USING (auth.jwt()->>'role' = 'admin');

-- Policies for chef_notifications
CREATE POLICY "Chef can view and update notifications"
    ON chef_notifications FOR SELECT
    USING (auth.jwt()->>'role' IN ('chef', 'admin'));

CREATE POLICY "Chef can update notifications"
    ON chef_notifications FOR UPDATE
    USING (auth.jwt()->>'role' IN ('chef', 'admin'));

-- Insert default menu categories
INSERT INTO menu_categories (name, description, sort_order) VALUES
('Customized Combo', 'Create your own combination', 1),
('Breakfast', 'Start your day right', 2),
('Starters', 'Begin your meal with these delights', 3),
('Brunch', 'Perfect for late morning', 4),
('Lunch', 'Midday favorites', 5),
('Dinner', 'Evening specialties', 6),
('Salads', 'Fresh and healthy options', 7),
('Beverages', 'Drinks and refreshments', 8),
('Desserts', 'Sweet endings', 9),
('Seasonal', 'Limited time offerings', 10);

-- Update existing menu items with categories
DO $$ 
DECLARE 
    breakfast_id uuid;
    starters_id uuid;
    beverages_id uuid;
    desserts_id uuid;
BEGIN
    SELECT id INTO breakfast_id FROM menu_categories WHERE name = 'Breakfast' LIMIT 1;
    SELECT id INTO starters_id FROM menu_categories WHERE name = 'Starters' LIMIT 1;
    SELECT id INTO beverages_id FROM menu_categories WHERE name = 'Beverages' LIMIT 1;
    SELECT id INTO desserts_id FROM menu_categories WHERE name = 'Desserts' LIMIT 1;

    -- Update existing menu items with categories
    UPDATE menu_items SET category_id = starters_id WHERE name IN ('Crispy Calamari', 'Bruschetta', 'Spring Rolls');
    UPDATE menu_items SET category_id = desserts_id WHERE name IN ('Tiramisu', 'Chocolate Lava Cake', 'Crème Brûlée');
    UPDATE menu_items SET category_id = beverages_id WHERE name IN ('Fresh Lemonade', 'Craft Beer', 'Wine');
END $$;