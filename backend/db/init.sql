-- ==========================================================
-- E-commerce database schema (runs automatically on first
-- container start via docker-entrypoint-initdb.d)
-- ==========================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'placed',
    total NUMERIC(10, 2) NOT NULL,
    shipping_name VARCHAR(160),
    shipping_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ==========================================================
-- Seed data
-- ==========================================================

INSERT INTO categories (name) VALUES
    ('Electronics'), ('Home & Kitchen'), ('Books'), ('Fashion'), ('Sports')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, description, price, image_url, category_id, stock)
SELECT * FROM (VALUES
    ('Wireless Headphones', 'Over-ear Bluetooth headphones with noise cancellation and 30-hour battery life.', 79.99, 'https://picsum.photos/seed/headphones/500/500', 1, 50),
    ('Smart Watch', 'Fitness tracking smart watch with heart-rate monitor and GPS.', 129.99, 'https://picsum.photos/seed/smartwatch/500/500', 1, 35),
    ('Mechanical Keyboard', 'RGB backlit mechanical keyboard with hot-swappable switches.', 89.50, 'https://picsum.photos/seed/keyboard/500/500', 1, 40),
    ('Stainless Steel Cookware Set', '10-piece stainless steel pots and pans set, dishwasher safe.', 149.00, 'https://picsum.photos/seed/cookware/500/500', 2, 20),
    ('Ceramic Coffee Mug Set', 'Set of 4 handmade ceramic mugs, 350ml each.', 24.99, 'https://picsum.photos/seed/mugs/500/500', 2, 100),
    ('The Pragmatic Programmer', 'A classic book on software craftsmanship and best practices.', 34.99, 'https://picsum.photos/seed/book1/500/500', 3, 60),
    ('Atomic Habits', 'A guide to building good habits and breaking bad ones.', 18.99, 'https://picsum.photos/seed/book2/500/500', 3, 80),
    ('Men''s Running Shoes', 'Lightweight breathable running shoes with cushioned sole.', 64.99, 'https://picsum.photos/seed/shoes/500/500', 4, 45),
    ('Women''s Denim Jacket', 'Classic fit denim jacket, machine washable.', 54.00, 'https://picsum.photos/seed/jacket/500/500', 4, 30),
    ('Yoga Mat', 'Non-slip eco-friendly yoga mat, 6mm thick.', 29.99, 'https://picsum.photos/seed/yogamat/500/500', 5, 70),
    ('Adjustable Dumbbell Set', 'Pair of adjustable dumbbells, 5-25 lbs each.', 149.99, 'https://picsum.photos/seed/dumbbell/500/500', 5, 15),
    ('Portable Bluetooth Speaker', 'Waterproof portable speaker with 12-hour playtime.', 39.99, 'https://picsum.photos/seed/speaker/500/500', 1, 55)
) AS v(name, description, price, image_url, category_id, stock)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = v.name);
