-- Eliminar tipos ENUM si existen
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS product_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- Crear tipos ENUM
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE product_status AS ENUM ('active', 'inactive');
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'cancelled');

-- Eliminar tablas si existen
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Crear tablas
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255),
    stock INTEGER NOT NULL DEFAULT 0,
    status product_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status order_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos de demo
INSERT INTO users (name, email, password, role) VALUES 
('Admin Demo', 'admin@demo.com', '$2a$10$EKGZHh7YhB9nzHQwxFB.0.9Pq1ULmVJBJUOYVpJ0KPAgbsXJZ0V0O', 'admin'),
('Cliente Demo', 'cliente@demo.com', '$2a$10$EKGZHh7YhB9nzHQwxFB.0.9Pq1ULmVJBJUOYVpJ0KPAgbsXJZ0V0O', 'user');

INSERT INTO products (name, description, price, image, stock) VALUES 
('Smartphone Demo', 'Teléfono de demostración', 9999.99, '/images/products/phone-demo.jpg', 10),
('Laptop Demo', 'Laptop de demostración', 19999.99, '/images/products/laptop-demo.jpg', 5); 