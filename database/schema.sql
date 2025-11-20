-- Database schema for Peer-to-Peer Marketplace (campus scope)

DROP DATABASE IF EXISTS campus_marketplace;
CREATE DATABASE campus_marketplace;
USE campus_marketplace;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user','admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    user_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status ENUM('open','resolved') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample data (password hashes generated with bcrypt, salt rounds=10)
INSERT INTO admins (email, password) VALUES
('admin@mite.ac.in', '$2a$10$7eqJtq98hPqEX7fNZaFWoOaR8S4/l5GfM9mWph7rLeQUYdeteGBOa');

INSERT INTO users (name, email, password) VALUES
('Aditi Rao', 'aditi.rao@mite.ac.in', '$2a$10$7eqJtq98hPqEX7fNZaFWoOaR8S4/l5GfM9mWph7rLeQUYdeteGBOa'),
('Bhavesh Kulkarni', 'bhavesh.k@mite.ac.in', '$2a$10$7eqJtq98hPqEX7fNZaFWoOaR8S4/l5GfM9mWph7rLeQUYdeteGBOa');

INSERT INTO items (user_id, title, description, price, category, image_url) VALUES
(1, 'Graphing Calculator', 'Casio fx-991EX in great condition.', 2200.00, 'Electronics', '/uploads/sample-calculator.jpg'),
(2, 'Dorm Mini Fridge', 'Compact fridge perfect for hostel rooms.', 3500.00, 'Appliances', '/uploads/sample-fridge.jpg');

INSERT INTO reports (item_id, user_id, reason, status) VALUES
(1, 2, 'Listing price seems too high for used condition.', 'open');

