-- MASM Database Schema
-- Multi-Account Sharing Platform

CREATE DATABASE IF NOT EXISTS masm_db;
USE masm_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Services table (Netflix, Spotify, etc.)
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(500),
    login_url VARCHAR(500) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'streaming',
    color VARCHAR(7) DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Accounts table (actual service accounts)
CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_enc TEXT NOT NULL,
    cookies_enc TEXT,
    status ENUM('active', 'inactive', 'banned', 'expired') DEFAULT 'active',
    max_users INT DEFAULT 1,
    cookies_updated_at DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Sessions table (active user sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_id INT NOT NULL,
    cookie_set_enc TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status ENUM('active', 'expired', 'revoked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_sessions_user ON sessions(user_id, status);
CREATE INDEX idx_sessions_account ON sessions(account_id, status);
CREATE INDEX idx_accounts_service ON accounts(service_id, status);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, username, role) VALUES
('admin@masm.com', '$2b$10$placeholder', 'Admin', 'admin');
