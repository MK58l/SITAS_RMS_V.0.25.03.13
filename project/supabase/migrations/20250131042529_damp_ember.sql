/*
  # Initial Schema Setup for Restaurant Management System

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `phone` (text)
      - `name` (text)
      - `role` (text)
      - `created_at` (timestamp)
    
    - `tables`
      - `id` (uuid, primary key)
      - `table_number` (integer, unique)
      - `capacity` (integer)
      - `is_reserved` (boolean)
      - `qr_code` (text)
      - `current_order_id` (uuid, references orders)
      - `created_at` (timestamp)
    
    - `reservations`
      - `id` (uuid, primary key)
      - `table_id` (uuid, references tables)
      - `user_id` (uuid, references users)
      - `reservation_date` (date)
      - `reservation_time` (time)
      - `duration` (integer)
      - `created_at` (timestamp)
    
    - `menu_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (decimal)
      - `category` (text)
      - `image_url` (text)
      - `is_available` (boolean)
      - `created_at` (timestamp)
    
    - `orders`
      - `id` (uuid, primary key)
      - `table_id` (uuid, references tables)
      - `user_id` (uuid, references users)
      - `status` (text)
      - `total_amount` (decimal)
      - `payment_status` (text)
      - `payment_method` (text)
      - `created_at` (timestamp)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `menu_item_id` (uuid, references menu_items)
      - `quantity` (integer)
      - `price` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for each user role (admin, staff, customer)
*/

-- Create tables
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number integer UNIQUE NOT NULL,
  capacity integer NOT NULL,
  is_reserved boolean DEFAULT false,
  qr_code text NOT NULL,
  current_order_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES tables NOT NULL,
  user_id uuid REFERENCES users NOT NULL,
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  duration integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal NOT NULL,
  category text NOT NULL,
  image_url text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES tables NOT NULL,
  user_id uuid REFERENCES users NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
  total_amount decimal NOT NULL,
  payment_status text NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_method text CHECK (payment_method IN ('cash', 'paypal')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders NOT NULL,
  menu_item_id uuid REFERENCES menu_items NOT NULL,
  quantity integer NOT NULL,
  price decimal NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id OR auth.jwt()->>'role' IN ('admin', 'staff'));

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id OR auth.jwt()->>'role' = 'admin');

-- Create policies for tables table
CREATE POLICY "Anyone can view tables"
  ON tables
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and staff can manage tables"
  ON tables
  FOR ALL
  USING (auth.jwt()->>'role' IN ('admin', 'staff'));

-- Create policies for reservations table
CREATE POLICY "Users can view their reservations"
  ON reservations
  FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'staff'));

CREATE POLICY "Users can create reservations"
  ON reservations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create policies for menu_items table
CREATE POLICY "Anyone can view menu items"
  ON menu_items
  FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage menu items"
  ON menu_items
  FOR ALL
  USING (auth.jwt()->>'role' = 'admin');

-- Create policies for orders table
CREATE POLICY "Users can view their orders"
  ON orders
  FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'staff'));

CREATE POLICY "Users can create orders"
  ON orders
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create policies for order_items table
CREATE POLICY "Users can view their order items"
  ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR auth.jwt()->>'role' IN ('admin', 'staff'))
    )
  );

CREATE POLICY "Users can create order items"
  ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

ALTER TABLE orders
ADD COLUMN payment_id TEXT;