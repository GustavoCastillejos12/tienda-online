CREATE DATABASE IF NOT EXISTS tienda_online;
USE tienda_online;

-- Eliminar datos existentes
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM cart;
DELETE FROM products;
DELETE FROM users;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255),
    stock INT NOT NULL DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insertar usuario administrador
INSERT INTO users (name, email, password, role) VALUES 
('Admin', 'admin@example.com', '$2a$10$EKGZHh7YhB9nzHQwxFB.0.9Pq1ULmVJBJUOYVpJ0KPAgbsXJZ0V0O', 'admin');

-- Insertar usuario cliente demo
INSERT INTO users (name, email, password, role) VALUES 
('Cliente Demo', 'cliente@demo.com', '$2a$10$EKGZHh7YhB9nzHQwxFB.0.9Pq1ULmVJBJUOYVpJ0KPAgbsXJZ0V0O', 'user');

-- Insertar productos de ejemplo
INSERT INTO products (name, description, price, image, stock, created_by) VALUES 
('Smartphone XYZ', 'Smartphone de última generación con 128GB de almacenamiento', 8999.99, '/images/products/smartphone.jpg', 25, 1),
('Laptop Pro', 'Laptop profesional con procesador i7 y 16GB RAM', 19999.99, '/images/products/laptop.jpg', 15, 1),
('Audífonos Bluetooth', 'Audífonos inalámbricos con cancelación de ruido', 1299.99, '/images/products/headphones.jpg', 50, 1),
('Smartwatch Sport', 'Reloj inteligente con monitor cardíaco', 2499.99, '/images/products/smartwatch.jpg', 30, 1); 