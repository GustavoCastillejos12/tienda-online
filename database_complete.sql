-- Crear y usar la base de datos
CREATE DATABASE IF NOT EXISTS tienda_online;
USE tienda_online;

-- Eliminar tablas si existen
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- Crear tabla de usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de categorías
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de productos
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255),
    stock INT NOT NULL DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    sku VARCHAR(50) UNIQUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Crear tabla del carrito
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Crear tabla de pedidos
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_postal_code VARCHAR(10),
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    order_status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Crear tabla de items de pedidos
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insertar usuarios de ejemplo
INSERT INTO users (name, email, password, role, phone, address, city, postal_code) VALUES 
('Admin', 'admin@example.com', '$2a$10$EKGZHh7YhB9nzHQwxFB.0.9Pq1ULmVJBJUOYVpJ0KPAgbsXJZ0V0O', 'admin', '555-0100', 'Calle Admin 123', 'Ciudad Admin', '12345'),
('Cliente Demo', 'cliente@demo.com', '$2a$10$EKGZHh7YhB9nzHQwxFB.0.9Pq1ULmVJBJUOYVpJ0KPAgbsXJZ0V0O', 'user', '555-0200', 'Calle Cliente 456', 'Ciudad Cliente', '67890'),
('Juan Pérez', 'juan@example.com', '$2a$10$EKGZHh7YhB9nzHQwxFB.0.9Pq1ULmVJBJUOYVpJ0KPAgbsXJZ0V0O', 'user', '555-0301', 'Av. Principal 789', 'Ciudad Este', '11111'),
('María García', 'maria@example.com', '$2a$10$EKGZHh7YhB9nzHQwxFB.0.9Pq1ULmVJBJUOYVpJ0KPAgbsXJZ0V0O', 'user', '555-0402', 'Calle Sur 321', 'Ciudad Sur', '22222');

-- Insertar categorías
INSERT INTO categories (name, description, image, status) VALUES 
('Electrónicos', 'Productos electrónicos y gadgets', '/images/categories/electronics.jpg', 'active'),
('Computadoras', 'Laptops y computadoras de escritorio', '/images/categories/computers.jpg', 'active'),
('Accesorios', 'Accesorios para dispositivos', '/images/categories/accessories.jpg', 'active'),
('Audio', 'Equipos de audio y sonido', '/images/categories/audio.jpg', 'active'),
('Smartphones', 'Teléfonos inteligentes', '/images/categories/smartphones.jpg', 'active');

-- Insertar productos
INSERT INTO products (category_id, name, description, price, image, stock, status, featured, sku, created_by) VALUES 
(5, 'Smartphone XYZ Pro', 'Smartphone de última generación con 256GB de almacenamiento', 12999.99, '/images/products/smartphone-pro.jpg', 30, 'active', true, 'PHONE-001', 1),
(5, 'Smartphone XYZ Lite', 'Versión económica con 128GB de almacenamiento', 8999.99, '/images/products/smartphone-lite.jpg', 25, 'active', false, 'PHONE-002', 1),
(2, 'Laptop Pro X1', 'Laptop profesional con procesador i9 y 32GB RAM', 29999.99, '/images/products/laptop-pro.jpg', 10, 'active', true, 'LAPTOP-001', 1),
(2, 'Laptop Home', 'Laptop para uso doméstico con i5 y 8GB RAM', 14999.99, '/images/products/laptop-home.jpg', 15, 'active', false, 'LAPTOP-002', 1),
(3, 'Audífonos Pro', 'Audífonos inalámbricos con cancelación de ruido', 2499.99, '/images/products/headphones-pro.jpg', 50, 'active', true, 'AUDIO-001', 1),
(3, 'Mouse Gaming', 'Mouse gaming con 8000 DPI y RGB', 899.99, '/images/products/mouse-gaming.jpg', 40, 'active', false, 'ACC-001', 1),
(4, 'Bocina Bluetooth', 'Bocina portátil resistente al agua', 1299.99, '/images/products/speaker.jpg', 35, 'active', true, 'AUDIO-002', 1),
(4, 'Soundbar 2.1', 'Barra de sonido con subwoofer inalámbrico', 3999.99, '/images/products/soundbar.jpg', 20, 'active', false, 'AUDIO-003', 1),
(1, 'Tablet 10"', 'Tablet Android con pantalla 2K', 4999.99, '/images/products/tablet.jpg', 25, 'active', true, 'TAB-001', 1),
(1, 'Smartwatch Sport', 'Reloj inteligente con GPS y monitor cardíaco', 2999.99, '/images/products/smartwatch.jpg', 30, 'active', true, 'WATCH-001', 1);

-- Insertar algunos pedidos de ejemplo
INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, shipping_postal_code, payment_method, payment_status, order_status) VALUES 
(2, 15499.98, 'Calle Cliente 456', 'Ciudad Cliente', '67890', 'credit_card', 'completed', 'delivered'),
(3, 29999.99, 'Av. Principal 789', 'Ciudad Este', '11111', 'paypal', 'completed', 'shipped'),
(4, 3799.98, 'Calle Sur 321', 'Ciudad Sur', '22222', 'credit_card', 'completed', 'processing');

-- Insertar items de los pedidos
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES 
(1, 2, 1, 8999.99),
(1, 5, 1, 2499.99),
(2, 3, 1, 29999.99),
(3, 5, 1, 2499.99),
(3, 6, 1, 899.99); 