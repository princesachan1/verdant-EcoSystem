-- Verdant Database Initialization Script
-- PostgreSQL 16

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    wallet DECIMAL(10, 2) DEFAULT 0.00 CHECK (wallet >= 0),
    green_points INTEGER DEFAULT 0 CHECK (green_points >= 0),
    daily_protein_goal INTEGER DEFAULT 0,
    daily_cal_goal INTEGER DEFAULT 0,
    today_protein INTEGER DEFAULT 0,
    today_cals INTEGER DEFAULT 0,
    last_active_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    image TEXT,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    calories INTEGER DEFAULT 0,
    protein INTEGER DEFAULT 0,
    fat INTEGER DEFAULT 0,
    carbs INTEGER DEFAULT 0,
    fiber INTEGER DEFAULT 0,
    sodium INTEGER DEFAULT 0,
    popularity INTEGER DEFAULT 0,
    sentiment_score DECIMAL(3, 1) DEFAULT 3.0 CHECK (sentiment_score >= 0 AND sentiment_score <= 5),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    points INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Placed',
    user_name VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    payment_method VARCHAR(50),
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    review_text TEXT,
    sentiment_score DECIMAL(3, 1) CHECK (sentiment_score >= 0 AND sentiment_score <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_item_id ON reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(is_active);

-- Create Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add Triggers for Updated At
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Default User
INSERT INTO users (id, name, email, phone, address, wallet, green_points, daily_protein_goal, daily_cal_goal)
VALUES (
    'user_1',
    'Alex Verdant',
    'alex@verdant.com',
    '+91 98765 43210',
    '402, Green Valley, Eco City',
    10000.00,
    1200,
    0,
    0
) ON CONFLICT (id) DO NOTHING;

-- Insert Additional Test Users
INSERT INTO users (id, name, email, phone, address, wallet, green_points, daily_protein_goal, daily_cal_goal) VALUES
('user_2', 'Sarah Green', 'sarah@verdant.com', '+91 98765 43211', '101, Eco Apartments, Green City', 5000.00, 850, 50, 2000),
('user_3', 'Mike Healthy', 'mike@verdant.com', '+91 98765 43212', '205, Wellness Tower, Health City', 15000.00, 2500, 80, 2500),
('user_4', 'Emma Fitness', 'emma@verdant.com', '+91 98765 43213', '303, Gym Plaza, Fit City', 8000.00, 1800, 70, 2200),
('user_5', 'John Vegan', 'john@verdant.com', '+91 98765 43214', '404, Plant Street, Vegan Town', 12000.00, 3200, 60, 1800),
('user_6', 'Lisa Organic', 'lisa@verdant.com', '+91 98765 43215', '505, Nature Complex, Organic City', 6000.00, 1500, 55, 2100),
('user_7', 'David Protein', 'david@verdant.com', '+91 98765 43216', '606, Muscle Avenue, Gym City', 9000.00, 2100, 100, 2800),
('user_8', 'Anna Balanced', 'anna@verdant.com', '+91 98765 43217', '707, Harmony Street, Balance City', 7500.00, 1650, 65, 2300),
('user_9', 'Tom Lowcarb', 'tom@verdant.com', '+91 98765 43218', '808, Keto Lane, Diet City', 11000.00, 2800, 90, 1500),
('user_10', 'Rachel Superfood', 'rachel@verdant.com', '+91 98765 43219', '909, Nutrient Plaza, Health City', 13000.00, 3500, 75, 2400)
ON CONFLICT (id) DO NOTHING;

-- Insert Comprehensive Menu Items (50 items with varied nutrition profiles and 30 low-stock items)
INSERT INTO menu_items (name, category, price, image, stock, calories, protein, fat, carbs, fiber, sodium, sentiment_score) VALUES
-- High Protein Items (5 items, 3 low-stock)
('Grilled Chicken Salad', 'Main Course', 280.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500', 15, 320, 42, 12, 18, 8, 450, 4.5),
('Protein Power Bowl', 'Main Course', 320.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500', 12, 450, 55, 15, 35, 10, 520, 4.7),
('Quinoa Buddha Bowl', 'Main Course', 295.00, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500', 18, 380, 18, 14, 52, 12, 380, 4.6),
('Tofu Stir Fry', 'Main Course', 245.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500', 50, 290, 22, 16, 28, 6, 620, 4.2),
('Salmon Teriyaki', 'Main Course', 450.00, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500', 8, 420, 38, 22, 24, 4, 780, 4.8),

-- Vegan Options (5 items, 3 low-stock)
('Vegan Burger', 'Fast Food', 220.00, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=500', 22, 380, 15, 18, 45, 9, 550, 4.4),
('Chickpea Curry', 'Main Course', 185.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500', 28, 320, 14, 12, 48, 11, 480, 4.3),
('Avocado Toast', 'Starter', 165.00, 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=500', 19, 280, 8, 16, 32, 7, 320, 4.5),
('Lentil Soup', 'Soups', 145.00, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500', 65, 220, 16, 4, 38, 14, 420, 4.1),
('Hummus Platter', 'Starter', 195.00, 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=500', 52, 340, 12, 20, 35, 8, 580, 4.2),

-- Traditional Indian (5 items, 2 low-stock)
('Paneer Tikka Masala', 'Main Course', 265.00, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500', 24, 420, 24, 28, 32, 5, 720, 4.6),
('Butter Chicken', 'Main Course', 285.00, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500', 16, 480, 32, 32, 28, 4, 820, 4.7),
('Dal Makhani', 'Main Course', 175.00, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500', 70, 280, 18, 14, 36, 12, 540, 4.4),
('Tandoori Roti', 'Breads', 35.00, 'https://images.unsplash.com/photo-1619985663461-8e5e0fdeb5a1?w=500', 120, 120, 4, 2, 24, 2, 180, 4.0),
('Garlic Naan', 'Breads', 45.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500', 110, 180, 5, 6, 28, 2, 280, 4.3),

-- South Indian (4 items, 2 low-stock)
('Masala Dosa', 'South Indian', 125.00, 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=500', 26, 320, 8, 10, 58, 4, 420, 4.5),
('Idli Sambar', 'South Indian', 95.00, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500', 85, 180, 6, 2, 38, 6, 320, 4.2),
('Medu Vada', 'South Indian', 85.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500', 21, 220, 8, 12, 28, 5, 380, 4.1),
('Uttapam', 'South Indian', 115.00, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500', 72, 260, 7, 8, 45, 5, 360, 4.3),

-- Fast Food (4 items, 2 low-stock)
('Classic Burger', 'Fast Food', 185.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', 29, 520, 22, 28, 48, 3, 920, 3.8),
('Cheese Pizza', 'Italian', 295.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500', 14, 680, 28, 32, 72, 4, 1120, 4.0),
('French Fries', 'Fast Food', 95.00, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500', 95, 380, 4, 18, 52, 4, 280, 3.5),
('Chicken Wings', 'Fast Food', 245.00, 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=500', 11, 420, 38, 28, 12, 2, 1080, 4.1),

-- Chinese (4 items, 2 low-stock)
('Veg Fried Rice', 'Chinese', 165.00, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500', 88, 380, 8, 12, 68, 3, 720, 4.0),
('Hakka Noodles', 'Chinese', 175.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500', 27, 420, 10, 14, 72, 4, 820, 4.2),
('Manchurian Dry', 'Chinese', 195.00, 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500', 23, 320, 12, 18, 38, 5, 980, 3.9),
('Spring Rolls', 'Chinese', 145.00, 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500', 75, 280, 8, 14, 36, 4, 520, 4.1),

-- Drinks & Smoothies (4 items, 2 low-stock)
('Green Smoothie', 'Drinks', 125.00, 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=500', 30, 180, 6, 4, 38, 8, 120, 4.6),
('Protein Shake', 'Drinks', 165.00, 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=500', 17, 220, 32, 6, 28, 4, 180, 4.5),
('Fresh Orange Juice', 'Drinks', 85.00, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500', 100, 120, 2, 0, 28, 2, 20, 4.3),
('Masala Chai', 'Drinks', 45.00, 'https://images.unsplash.com/photo-1597318130878-aa0d8b2f086b?w=500', 150, 80, 2, 3, 12, 0, 40, 4.4),

-- Desserts (4 items, 2 low-stock)
('Chocolate Brownie', 'Dessert', 125.00, 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=500', 20, 420, 6, 22, 52, 3, 180, 4.2),
('Gulab Jamun', 'Dessert', 85.00, 'https://images.unsplash.com/photo-1571167530149-c9c4b0a5a5c7?w=500', 80, 320, 4, 14, 48, 1, 120, 4.3),
('Ice Cream Sundae', 'Dessert', 145.00, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500', 13, 380, 6, 18, 52, 2, 140, 4.1),
('Fruit Salad', 'Dessert', 95.00, 'https://images.unsplash.com/photo-1564093497595-593b96d80180?w=500', 70, 150, 2, 1, 38, 6, 20, 4.5),

-- Healthy Options (4 items, 3 low-stock)
('Kale Salad', 'Healthy', 185.00, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500', 10, 180, 8, 12, 18, 9, 280, 4.4),
('Chia Pudding', 'Healthy', 145.00, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500', 25, 220, 8, 10, 32, 12, 120, 4.6),
('Acai Bowl', 'Healthy', 225.00, 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=500', 9, 320, 6, 14, 52, 10, 80, 4.7),
('Spirulina Smoothie', 'Healthy', 175.00, 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=500', 42, 160, 12, 4, 24, 6, 140, 4.3),

-- Breakfast (4 items, 2 low-stock)
('Oatmeal Bowl', 'Breakfast', 125.00, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=500', 85, 280, 10, 8, 48, 8, 180, 4.4),
('Egg Benedict', 'Breakfast', 245.00, 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500', 14, 420, 24, 28, 32, 3, 720, 4.5),
('Pancakes', 'Breakfast', 165.00, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500', 28, 480, 8, 16, 78, 4, 420, 4.2),
('Granola Parfait', 'Breakfast', 155.00, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500', 58, 320, 12, 14, 48, 6, 180, 4.5),

-- Pasta & Italian (4 items, 2 low-stock)
('Penne Arrabiata', 'Italian', 245.00, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500', 19, 420, 14, 16, 62, 5, 680, 4.3),
('Margherita Pizza', 'Italian', 275.00, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500', 24, 580, 24, 26, 68, 4, 920, 4.4),
('Lasagna', 'Italian', 325.00, 'https://images.unsplash.com/photo-1619895092538-128341789043?w=500', 42, 620, 32, 34, 58, 5, 1080, 4.6),
('Carbonara', 'Italian', 295.00, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500', 48, 680, 28, 42, 62, 3, 980, 4.5),

-- Wraps & Sandwiches (3 items, 2 low-stock)
('Falafel Wrap', 'Fast Food', 165.00, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500', 20, 380, 16, 18, 48, 8, 620, 4.3),
('Club Sandwich', 'Fast Food', 195.00, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500', 12, 420, 28, 22, 38, 4, 820, 4.2),
('Veggie Wrap', 'Healthy', 145.00, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500', 75, 320, 12, 14, 42, 7, 480, 4.4),

-- NEW ITEMS (3 items to reach 50 total, all low-stock)
('Biryani Special', 'Main Course', 295.00, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500', 7, 520, 28, 18, 68, 4, 840, 4.8),
('Sushi Platter', 'Japanese', 450.00, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500', 6, 380, 32, 8, 52, 3, 620, 4.9),
('Ramen Bowl', 'Japanese', 285.00, 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=500', 11, 450, 24, 14, 58, 5, 1120, 4.6)
ON CONFLICT DO NOTHING;


-- Insert Sample Orders (30+ orders with varied patterns)
INSERT INTO orders (id, user_id, items, total, points, status, user_name, address, phone, created_at) VALUES
('ORD-2024-001', 'user_2', '[{"name":"Grilled Chicken Salad","price":280,"points":28,"protein":42,"cals":320}]', 280.00, 28, 'Delivered', 'Sarah Green', '101, Eco Apartments, Green City', '+91 98765 43211', NOW() - INTERVAL '30 days'),
('ORD-2024-002', 'user_3', '[{"name":"Protein Power Bowl","price":320,"points":32,"protein":55,"cals":450},{"name":"Protein Shake","price":165,"points":17,"protein":32,"cals":220}]', 485.00, 49, 'Delivered', 'Mike Healthy', '205, Wellness Tower, Health City', '+91 98765 43212', NOW() - INTERVAL '28 days'),
('ORD-2024-003', 'user_4', '[{"name":"Quinoa Buddha Bowl","price":295,"points":30,"protein":18,"cals":380}]', 295.00, 30, 'Delivered', 'Emma Fitness', '303, Gym Plaza, Fit City', '+91 98765 43213', NOW() - INTERVAL '27 days'),
('ORD-2024-004', 'user_5', '[{"name":"Vegan Burger","price":220,"points":22,"protein":15,"cals":380},{"name":"Green Smoothie","price":125,"points":13,"protein":6,"cals":180}]', 345.00, 35, 'Delivered', 'John Vegan', '404, Plant Street, Vegan Town', '+91 98765 43214', NOW() - INTERVAL '25 days'),
('ORD-2024-005', 'user_6', '[{"name":"Chickpea Curry","price":185,"points":19,"protein":14,"cals":320},{"name":"Tandoori Roti","price":35,"points":4,"protein":4,"cals":120}]', 220.00, 23, 'Delivered', 'Lisa Organic', '505, Nature Complex, Organic City', '+91 98765 43215', NOW() - INTERVAL '24 days'),
('ORD-2024-006', 'user_7', '[{"name":"Salmon Teriyaki","price":450,"points":45,"protein":38,"cals":420},{"name":"Protein Shake","price":165,"points":17,"protein":32,"cals":220}]', 615.00, 62, 'Delivered', 'David Protein', '606, Muscle Avenue, Gym City', '+91 98765 43216', NOW() - INTERVAL '22 days'),
('ORD-2024-007', 'user_8', '[{"name":"Paneer Tikka Masala","price":265,"points":27,"protein":24,"cals":420},{"name":"Garlic Naan","price":45,"points":5,"protein":5,"cals":180}]', 310.00, 32, 'Delivered', 'Anna Balanced', '707, Harmony Street, Balance City', '+91 98765 43217', NOW() - INTERVAL '20 days'),
('ORD-2024-008', 'user_9', '[{"name":"Grilled Chicken Salad","price":280,"points":28,"protein":42,"cals":320}]', 280.00, 28, 'Delivered', 'Tom Lowcarb', '808, Keto Lane, Diet City', '+91 98765 43218', NOW() - INTERVAL '18 days'),
('ORD-2024-009', 'user_10', '[{"name":"Acai Bowl","price":225,"points":23,"protein":6,"cals":320},{"name":"Chia Pudding","price":145,"points":15,"protein":8,"cals":220}]', 370.00, 38, 'Delivered', 'Rachel Superfood', '909, Nutrient Plaza, Health City', '+91 98765 43219', NOW() - INTERVAL '16 days'),
('ORD-2024-010', 'user_2', '[{"name":"Masala Dosa","price":125,"points":13,"protein":8,"cals":320},{"name":"Masala Chai","price":45,"points":5,"protein":2,"cals":80}]', 170.00, 18, 'Delivered', 'Sarah Green', '101, Eco Apartments, Green City', '+91 98765 43211', NOW() - INTERVAL '15 days'),
('ORD-2024-011', 'user_3', '[{"name":"Butter Chicken","price":285,"points":29,"protein":32,"cals":480},{"name":"Garlic Naan","price":45,"points":5,"protein":5,"cals":180}]', 330.00, 34, 'Delivered', 'Mike Healthy', '205, Wellness Tower, Health City', '+91 98765 43212', NOW() - INTERVAL '14 days'),
('ORD-2024-012', 'user_4', '[{"name":"Tofu Stir Fry","price":245,"points":25,"protein":22,"cals":290}]', 245.00, 25, 'Delivered', 'Emma Fitness', '303, Gym Plaza, Fit City', '+91 98765 43213', NOW() - INTERVAL '12 days'),
('ORD-2024-013', 'user_5', '[{"name":"Lentil Soup","price":145,"points":15,"protein":16,"cals":220},{"name":"Avocado Toast","price":165,"points":17,"protein":8,"cals":280}]', 310.00, 32, 'Delivered', 'John Vegan', '404, Plant Street, Vegan Town', '+91 98765 43214', NOW() - INTERVAL '10 days'),
('ORD-2024-014', 'user_6', '[{"name":"Dal Makhani","price":175,"points":18,"protein":18,"cals":280},{"name":"Tandoori Roti","price":35,"points":4,"protein":4,"cals":120}]', 210.00, 22, 'Delivered', 'Lisa Organic', '505, Nature Complex, Organic City', '+91 98765 43215', NOW() - INTERVAL '9 days'),
('ORD-2024-015', 'user_7', '[{"name":"Protein Power Bowl","price":320,"points":32,"protein":55,"cals":450},{"name":"Protein Shake","price":165,"points":17,"protein":32,"cals":220}]', 485.00, 49, 'Delivered', 'David Protein', '606, Muscle Avenue, Gym City', '+91 98765 43216', NOW() - INTERVAL '8 days'),
('ORD-2024-016', 'user_8', '[{"name":"Cheese Pizza","price":295,"points":30,"protein":28,"cals":680}]', 295.00, 30, 'Delivered', 'Anna Balanced', '707, Harmony Street, Balance City', '+91 98765 43217', NOW() - INTERVAL '7 days'),
('ORD-2024-017', 'user_9', '[{"name":"Salmon Teriyaki","price":450,"points":45,"protein":38,"cals":420}]', 450.00, 45, 'Delivered', 'Tom Lowcarb', '808, Keto Lane, Diet City', '+91 98765 43218', NOW() - INTERVAL '6 days'),
('ORD-2024-018', 'user_10', '[{"name":"Kale Salad","price":185,"points":19,"protein":8,"cals":180},{"name":"Spirulina Smoothie","price":175,"points":18,"protein":12,"cals":160}]', 360.00, 37, 'Delivered', 'Rachel Superfood', '909, Nutrient Plaza, Health City', '+91 98765 43219', NOW() - INTERVAL '5 days'),
('ORD-2024-019', 'user_2', '[{"name":"Idli Sambar","price":95,"points":10,"protein":6,"cals":180}]', 95.00, 10, 'Delivered', 'Sarah Green', '101, Eco Apartments, Green City', '+91 98765 43211', NOW() - INTERVAL '4 days'),
('ORD-2024-020', 'user_3', '[{"name":"Grilled Chicken Salad","price":280,"points":28,"protein":42,"cals":320},{"name":"Fresh Orange Juice","price":85,"points":9,"protein":2,"cals":120}]', 365.00, 37, 'Delivered', 'Mike Healthy', '205, Wellness Tower, Health City', '+91 98765 43212', NOW() - INTERVAL '3 days'),
('ORD-2024-021', 'user_4', '[{"name":"Quinoa Buddha Bowl","price":295,"points":30,"protein":18,"cals":380}]', 295.00, 30, 'Placed', 'Emma Fitness', '303, Gym Plaza, Fit City', '+91 98765 43213', NOW() - INTERVAL '2 days'),
('ORD-2024-022', 'user_5', '[{"name":"Hummus Platter","price":195,"points":20,"protein":12,"cals":340},{"name":"Falafel Wrap","price":165,"points":17,"protein":16,"cals":380}]', 360.00, 37, 'Placed', 'John Vegan', '404, Plant Street, Vegan Town', '+91 98765 43214', NOW() - INTERVAL '2 days'),
('ORD-2024-023', 'user_6', '[{"name":"Oatmeal Bowl","price":125,"points":13,"protein":10,"cals":280}]', 125.00, 13, 'Placed', 'Lisa Organic', '505, Nature Complex, Organic City', '+91 98765 43215', NOW() - INTERVAL '1 day'),
('ORD-2024-024', 'user_7', '[{"name":"Egg Benedict","price":245,"points":25,"protein":24,"cals":420},{"name":"Protein Shake","price":165,"points":17,"protein":32,"cals":220}]', 410.00, 42, 'Placed', 'David Protein', '606, Muscle Avenue, Gym City', '+91 98765 43216', NOW() - INTERVAL '1 day'),
('ORD-2024-025', 'user_8', '[{"name":"Margherita Pizza","price":275,"points":28,"protein":24,"cals":580}]', 275.00, 28, 'Placed', 'Anna Balanced', '707, Harmony Street, Balance City', '+91 98765 43217', NOW() - INTERVAL '12 hours'),
('ORD-2024-026', 'user_9', '[{"name":"Grilled Chicken Salad","price":280,"points":28,"protein":42,"cals":320}]', 280.00, 28, 'Placed', 'Tom Lowcarb', '808, Keto Lane, Diet City', '+91 98765 43218', NOW() - INTERVAL '6 hours'),
('ORD-2024-027', 'user_10', '[{"name":"Acai Bowl","price":225,"points":23,"protein":6,"cals":320},{"name":"Green Smoothie","price":125,"points":13,"protein":6,"cals":180}]', 350.00, 36, 'Placed', 'Rachel Superfood', '909, Nutrient Plaza, Health City', '+91 98765 43219', NOW() - INTERVAL '3 hours'),
('ORD-2024-028', 'user_1', '[{"name":"Paneer Tikka Masala","price":265,"points":27,"protein":24,"cals":420},{"name":"Garlic Naan","price":45,"points":5,"protein":5,"cals":180}]', 310.00, 32, 'Placed', 'Alex Verdant', '402, Green Valley, Eco City', '+91 98765 43210', NOW() - INTERVAL '2 hours'),
('ORD-2024-029', 'user_2', '[{"name":"Vegan Burger","price":220,"points":22,"protein":15,"cals":380}]', 220.00, 22, 'Placed', 'Sarah Green', '101, Eco Apartments, Green City', '+91 98765 43211', NOW() - INTERVAL '1 hour'),
('ORD-2024-030', 'user_3', '[{"name":"Protein Power Bowl","price":320,"points":32,"protein":55,"cals":450}]', 320.00, 32, 'Placed', 'Mike Healthy', '205, Wellness Tower, Health City', '+91 98765 43212', NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;

-- Insert Transactions (matching orders + wallet recharges)
INSERT INTO transactions (user_id, type, amount, description, payment_method, order_id, created_at) VALUES
-- Wallet recharges
('user_2', 'credit', 5000.00, 'Wallet recharge via upi', 'upi', NULL, NOW() - INTERVAL '31 days'),
('user_3', 'credit', 10000.00, 'Wallet recharge via card', 'card', NULL, NOW() - INTERVAL '29 days'),
('user_4', 'credit', 8000.00, 'Wallet recharge via netbanking', 'netbanking', NULL, NOW() - INTERVAL '28 days'),
('user_5', 'credit', 12000.00, 'Wallet recharge via upi', 'upi', NULL, NOW() - INTERVAL '26 days'),
('user_6', 'credit', 6000.00, 'Wallet recharge via card', 'card', NULL, NOW() - INTERVAL '25 days'),
('user_7', 'credit', 9000.00, 'Wallet recharge via upi', 'upi', NULL, NOW() - INTERVAL '23 days'),
('user_8', 'credit', 7500.00, 'Wallet recharge via netbanking', 'netbanking', NULL, NOW() - INTERVAL '21 days'),
('user_9', 'credit', 11000.00, 'Wallet recharge via card', 'card', NULL, NOW() - INTERVAL '19 days'),
('user_10', 'credit', 13000.00, 'Wallet recharge via upi', 'upi', NULL, NOW() - INTERVAL '17 days'),
-- Order payments
('user_2', 'debit', 280.00, 'Order ORD-2024-001', 'wallet', 'ORD-2024-001', NOW() - INTERVAL '30 days'),
('user_3', 'debit', 485.00, 'Order ORD-2024-002', 'wallet', 'ORD-2024-002', NOW() - INTERVAL '28 days'),
('user_4', 'debit', 295.00, 'Order ORD-2024-003', 'wallet', 'ORD-2024-003', NOW() - INTERVAL '27 days'),
('user_5', 'debit', 345.00, 'Order ORD-2024-004', 'wallet', 'ORD-2024-004', NOW() - INTERVAL '25 days'),
('user_6', 'debit', 220.00, 'Order ORD-2024-005', 'wallet', 'ORD-2024-005', NOW() - INTERVAL '24 days'),
('user_7', 'debit', 615.00, 'Order ORD-2024-006', 'wallet', 'ORD-2024-006', NOW() - INTERVAL '22 days'),
('user_8', 'debit', 310.00, 'Order ORD-2024-007', 'wallet', 'ORD-2024-007', NOW() - INTERVAL '20 days'),
('user_9', 'debit', 280.00, 'Order ORD-2024-008', 'wallet', 'ORD-2024-008', NOW() - INTERVAL '18 days'),
('user_10', 'debit', 370.00, 'Order ORD-2024-009', 'wallet', 'ORD-2024-009', NOW() - INTERVAL '16 days'),
('user_2', 'debit', 170.00, 'Order ORD-2024-010', 'wallet', 'ORD-2024-010', NOW() - INTERVAL '15 days'),
('user_3', 'debit', 330.00, 'Order ORD-2024-011', 'wallet', 'ORD-2024-011', NOW() - INTERVAL '14 days'),
('user_4', 'debit', 245.00, 'Order ORD-2024-012', 'wallet', 'ORD-2024-012', NOW() - INTERVAL '12 days'),
('user_5', 'debit', 310.00, 'Order ORD-2024-013', 'wallet', 'ORD-2024-013', NOW() - INTERVAL '10 days'),
('user_6', 'debit', 210.00, 'Order ORD-2024-014', 'wallet', 'ORD-2024-014', NOW() - INTERVAL '9 days'),
('user_7', 'debit', 485.00, 'Order ORD-2024-015', 'wallet', 'ORD-2024-015', NOW() - INTERVAL '8 days'),
('user_8', 'debit', 295.00, 'Order ORD-2024-016', 'wallet', 'ORD-2024-016', NOW() - INTERVAL '7 days'),
('user_9', 'debit', 450.00, 'Order ORD-2024-017', 'wallet', 'ORD-2024-017', NOW() - INTERVAL '6 days'),
('user_10', 'debit', 360.00, 'Order ORD-2024-018', 'wallet', 'ORD-2024-018', NOW() - INTERVAL '5 days'),
('user_2', 'debit', 95.00, 'Order ORD-2024-019', 'wallet', 'ORD-2024-019', NOW() - INTERVAL '4 days'),
('user_3', 'debit', 365.00, 'Order ORD-2024-020', 'wallet', 'ORD-2024-020', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- Insert Reviews (100+ reviews with varied sentiments for sentiment analysis)
INSERT INTO reviews (item_id, user_id, review_text, sentiment_score) VALUES
-- Positive reviews (4.5-5.0)
(1, 'user_2', 'Absolutely delicious! The chicken was perfectly grilled and the salad was fresh.', 5.0),
(2, 'user_3', 'Best protein bowl I have ever had! Great for post-workout meals.', 5.0),
(3, 'user_4', 'Love the quinoa bowl! Healthy and filling.', 4.8),
(5, 'user_7', 'Salmon teriyaki is amazing! Fresh fish and great flavor.', 5.0),
(6, 'user_5', 'Perfect vegan burger! Tastes just like the real thing.', 4.9),
(11, 'user_8', 'Paneer tikka masala is my favorite! Creamy and delicious.', 4.8),
(12, 'user_3', 'Butter chicken is fantastic! Rich and flavorful.', 4.9),
(16, 'user_2', 'Masala dosa is crispy and perfect! Love the sambar.', 4.7),
(28, 'user_10', 'Green smoothie is refreshing and healthy! Great taste.', 4.8),
(29, 'user_7', 'Protein shake is excellent! Helps with my fitness goals.', 4.9),
-- Good reviews (4.0-4.4)
(7, 'user_6', 'Chickpea curry is good, could use more spice.', 4.2),
(8, 'user_5', 'Avocado toast is nice, fresh ingredients.', 4.3),
(10, 'user_6', 'Hummus platter is tasty, good portion size.', 4.1),
(13, 'user_8', 'Dal makhani is good comfort food.', 4.2),
(17, 'user_2', 'Idli sambar is authentic and tasty.', 4.3),
(20, 'user_3', 'Classic burger is decent, good value for money.', 4.0),
(24, 'user_4', 'Veg fried rice is good, nice flavors.', 4.1),
(25, 'user_5', 'Hakka noodles are tasty and well-cooked.', 4.2),
(30, 'user_6', 'Fresh orange juice is good and refreshing.', 4.3),
(35, 'user_10', 'Kale salad is healthy and fresh.', 4.4),
-- Average reviews (3.5-3.9)
(21, 'user_9', 'Cheese pizza is okay, could be better.', 3.8),
(22, 'user_8', 'French fries are average, nothing special.', 3.5),
(23, 'user_7', 'Chicken wings are decent but a bit dry.', 3.7),
(26, 'user_4', 'Manchurian is okay, sauce could be better.', 3.6),
(27, 'user_3', 'Spring rolls are average, filling is bland.', 3.5),
(32, 'user_2', 'Chocolate brownie is okay, not very chocolatey.', 3.8),
(33, 'user_5', 'Gulab jamun is average, too sweet.', 3.6),
-- Negative reviews (2.5-3.4)
(22, 'user_10', 'French fries were cold when delivered.', 3.0),
(23, 'user_9', 'Chicken wings were overcooked and dry.', 2.8),
(26, 'user_8', 'Manchurian was too oily for my taste.', 3.2),
(33, 'user_4', 'Gulab jamun was too sweet and soggy.', 3.0),
-- More positive reviews for popular items
(1, 'user_4', 'Grilled chicken salad never disappoints!', 4.9),
(1, 'user_6', 'Fresh and healthy, my go-to meal.', 4.8),
(2, 'user_5', 'Protein power bowl is worth every penny!', 5.0),
(2, 'user_8', 'Perfect macros for my diet plan.', 4.9),
(3, 'user_7', 'Quinoa buddha bowl is delicious and nutritious.', 4.7),
(3, 'user_9', 'Love the variety of vegetables in this bowl.', 4.6),
(5, 'user_2', 'Salmon teriyaki is restaurant quality!', 5.0),
(5, 'user_4', 'Best salmon dish I have had in a while.', 4.8),
(6, 'user_3', 'Vegan burger exceeded my expectations!', 4.9),
(6, 'user_7', 'Great taste, you would not know it is vegan.', 4.7),
(11, 'user_5', 'Paneer tikka masala is creamy perfection.', 4.9),
(11, 'user_9', 'Authentic Indian flavors, love it!', 4.8),
(12, 'user_6', 'Butter chicken is rich and satisfying.', 4.9),
(12, 'user_10', 'Best butter chicken in town!', 5.0),
(16, 'user_3', 'Masala dosa is crispy and delicious.', 4.8),
(16, 'user_5', 'Authentic South Indian taste!', 4.7),
(28, 'user_4', 'Green smoothie is my morning energizer.', 4.9),
(28, 'user_8', 'Refreshing and packed with nutrients.', 4.8),
(29, 'user_9', 'Protein shake helps my recovery.', 4.9),
(29, 'user_2', 'Great taste and texture!', 4.7),
-- Mixed reviews for variety
(4, 'user_3', 'Tofu stir fry is good but could have more tofu.', 4.1),
(4, 'user_6', 'Nice flavors, good vegan option.', 4.3),
(7, 'user_8', 'Chickpea curry is hearty and filling.', 4.4),
(7, 'user_10', 'Good curry but a bit too thick.', 4.0),
(8, 'user_2', 'Avocado toast is simple but delicious.', 4.5),
(8, 'user_4', 'Fresh avocado, great breakfast option.', 4.4),
(9, 'user_5', 'Lentil soup is comforting and healthy.', 4.3),
(9, 'user_7', 'Good soup but needs more seasoning.', 3.9),
(10, 'user_3', 'Hummus platter is great for sharing.', 4.4),
(10, 'user_9', 'Fresh hummus, love the variety.', 4.2),
(13, 'user_4', 'Dal makhani is creamy and delicious.', 4.5),
(13, 'user_6', 'Good dal but a bit too rich.', 4.1),
(14, 'user_7', 'Tandoori roti is soft and fresh.', 4.2),
(14, 'user_8', 'Good roti, pairs well with curry.', 4.0),
(15, 'user_9', 'Garlic naan is flavorful and soft.', 4.5),
(15, 'user_10', 'Love the garlic flavor!', 4.4),
(17, 'user_3', 'Idli sambar is authentic and tasty.', 4.4),
(17, 'user_5', 'Soft idlis, great sambar.', 4.3),
(18, 'user_6', 'Medu vada is crispy outside, soft inside.', 4.2),
(18, 'user_8', 'Good vada but a bit oily.', 3.9),
(19, 'user_2', 'Uttapam is thick and filling.', 4.3),
(19, 'user_4', 'Good uttapam, nice toppings.', 4.1),
(20, 'user_5', 'Classic burger is satisfying.', 4.2),
(20, 'user_7', 'Good burger, juicy patty.', 4.0),
(21, 'user_6', 'Cheese pizza has good cheese quality.', 4.3),
(21, 'user_10', 'Pizza is good but crust could be crispier.', 3.9),
(24, 'user_8', 'Veg fried rice is flavorful.', 4.3),
(24, 'user_9', 'Good fried rice, nice portion.', 4.1),
(25, 'user_2', 'Hakka noodles are well-seasoned.', 4.4),
(25, 'user_3', 'Good noodles, not too oily.', 4.2),
(30, 'user_4', 'Fresh orange juice is pure and tasty.', 4.5),
(30, 'user_5', 'Love the freshness!', 4.4),
(31, 'user_6', 'Masala chai is aromatic and perfect.', 4.6),
(31, 'user_7', 'Best chai I have had!', 4.5),
(35, 'user_8', 'Kale salad is super healthy.', 4.6),
(35, 'user_9', 'Fresh kale, great dressing.', 4.4),
(36, 'user_10', 'Chia pudding is creamy and delicious.', 4.7),
(36, 'user_2', 'Love the texture and taste!', 4.6),
(37, 'user_3', 'Acai bowl is Instagram-worthy and tasty!', 4.8),
(37, 'user_4', 'Fresh fruits, great acai base.', 4.7),
(38, 'user_5', 'Spirulina smoothie is energizing.', 4.5),
(38, 'user_6', 'Healthy and tasty!', 4.4),
(39, 'user_7', 'Oatmeal bowl is hearty and filling.', 4.5),
(39, 'user_8', 'Good breakfast option.', 4.3),
(40, 'user_9', 'Egg benedict is perfectly poached.', 4.7),
(40, 'user_10', 'Delicious and elegant!', 4.6)
ON CONFLICT DO NOTHING;
