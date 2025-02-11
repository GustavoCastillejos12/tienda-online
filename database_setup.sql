-- Eliminar tipos ENUM si existen
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS product_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS shipping_status CASCADE;

-- Crear tipos ENUM
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE product_status AS ENUM ('active', 'inactive');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE shipping_status AS ENUM ('pending', 'shipped', 'delivered');

-- Eliminar tablas si existen
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Crear tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de categorías
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    status product_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de productos
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255),
    stock INTEGER NOT NULL DEFAULT 0,
    status product_status DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    sku VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla del carrito
CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de pedidos
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_postal_code VARCHAR(10),
    payment_method VARCHAR(50),
    payment_status payment_status DEFAULT 'pending',
    order_status order_status DEFAULT 'pending',
    shipping_status shipping_status DEFAULT 'pending',
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de items de pedidos
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar categorías de ejemplo
INSERT INTO categories (name, description, image) VALUES 
('Electrónicos', 'Productos electrónicos y gadgets', '/images/categories/electronics.jpg'),
('Computadoras', 'Laptops y computadoras de escritorio', '/images/categories/computers.jpg'),
('Accesorios', 'Accesorios para dispositivos', '/images/categories/accessories.jpg');

-- Insertar usuarios de demo
INSERT INTO users (name, email, password, role) VALUES 
('Admin Demo', 'admin@demo.com', '$2a$10$EKGZHh7YhB9nzHQwxFB.0.9Pq1ULmVJBJUOYVpJ0KPAgbsXJZ0V0O', 'admin'),
('Cliente Demo', 'cliente@demo.com', '$2a$10$EKGZHh7YhB9nzHQwxFB.0.9Pq1ULmVJBJUOYVpJ0KPAgbsXJZ0V0O', 'user');

-- Insertar productos de ejemplo
INSERT INTO products (category_id, name, description, price, image, stock, featured, sku) VALUES 
(1, 'Smartphone XYZ', 'Smartphone de última generación', 9999.99, '/images/products/smartphone.jpg', 10, true, 'PHONE001'),
(2, 'Laptop Pro', 'Laptop para profesionales', 19999.99, '/images/products/laptop.jpg', 5, true, 'LAPTOP001'),
(3, 'Audífonos Bluetooth', 'Audífonos inalámbricos premium', 1999.99, '/images/products/headphones.jpg', 20, false, 'AUDIO001'); 