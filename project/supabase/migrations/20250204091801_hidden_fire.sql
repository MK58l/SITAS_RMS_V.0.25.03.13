/*
  # Add sample restaurant data

  1. Tables
    - Ensure tables exist before inserting data
    - Add menu_items table if not exists
    - Add tables table if not exists

  2. Sample Data
    - Add sample menu items across different categories
    - Add tables with QR codes
*/

-- Create tables if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'menu_items') THEN
        CREATE TABLE menu_items (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            name text NOT NULL,
            description text,
            price decimal(10,2) NOT NULL,
            category text NOT NULL,
            image_url text,
            is_available boolean DEFAULT true,
            created_at timestamptz DEFAULT now()
        );
        
        ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can view menu items" ON menu_items
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tables') THEN
        CREATE TABLE tables (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            table_number integer UNIQUE NOT NULL,
            capacity integer NOT NULL,
            is_reserved boolean DEFAULT false,
            qr_code text NOT NULL,
            current_order_id uuid,
            created_at timestamptz DEFAULT now()
        );
        
        ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can view tables" ON tables
            FOR SELECT USING (true);
    END IF;
END $$;

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category, image_url, is_available) VALUES
-- Appetizers
('Crispy Calamari', 'Tender calamari rings served with marinara sauce', 12.99, 'Appetizers', 'https://images.unsplash.com/photo-1604909052743-94e838986d24', true),
('Bruschetta', 'Toasted bread topped with tomatoes, garlic, and basil', 8.99, 'Appetizers', 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f', true),
('Spring Rolls', 'Vegetable spring rolls with sweet chili sauce', 9.99, 'Appetizers', 'https://images.unsplash.com/photo-1548507200-47e6b24c9ed5', true),

-- Main Course
('Grilled Salmon', 'Fresh salmon with lemon butter sauce and seasonal vegetables', 24.99, 'Main Course', 'https://images.unsplash.com/photo-1567189022371-cc754891cdc9', true),
('Ribeye Steak', '12oz ribeye steak with garlic mashed potatoes', 32.99, 'Main Course', 'https://images.unsplash.com/photo-1600891964092-4316c288032e', true),
('Mushroom Risotto', 'Creamy arborio rice with wild mushrooms and parmesan', 18.99, 'Main Course', 'https://images.unsplash.com/photo-1476124369491-e7addf5db371', true),

-- Desserts
('Tiramisu', 'Classic Italian dessert with coffee-soaked ladyfingers', 8.99, 'Desserts', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9', true),
('Chocolate Lava Cake', 'Warm chocolate cake with molten center', 9.99, 'Desserts', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c', true),
('Crème Brûlée', 'Classic French vanilla custard with caramelized sugar', 8.99, 'Desserts', 'https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3', true),

-- Beverages
('Fresh Lemonade', 'Homemade lemonade with mint', 4.99, 'Beverages', 'https://images.unsplash.com/photo-1621263764928-df1444c5e859', true),
('Craft Beer', 'Selection of local craft beers', 6.99, 'Beverages', 'https://images.unsplash.com/photo-1608270586620-248524c67de9', true),
('Wine', 'House red or white wine', 7.99, 'Beverages', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3', true);

-- Insert sample tables
INSERT INTO tables (table_number, capacity, is_reserved, qr_code) VALUES
(1, 2, false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_1'),
(2, 2, false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_2'),
(3, 4, false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_3'),
(4, 4, false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_4'),
(5, 6, false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_5'),
(6, 6, false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_6'),
(7, 8, false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_7'),
(8, 8, false, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=table_8');