-- Layer7Top Database Schema for MariaDB
-- Run this to create all tables

CREATE DATABASE IF NOT EXISTS layer7top CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE layer7top;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telegram_id VARCHAR(100) DEFAULT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    plan VARCHAR(50) DEFAULT 'free',
    plan_expires DATETIME DEFAULT NULL,
    api_key VARCHAR(100) UNIQUE DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_api_key (api_key)
) ENGINE=InnoDB;

-- Attack servers table
CREATE TABLE IF NOT EXISTS attack_servers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    ssh_port INT DEFAULT 22,
    ssh_user VARCHAR(50) DEFAULT 'root',
    ssh_key TEXT DEFAULT NULL,
    ssh_password VARCHAR(255) DEFAULT NULL,
    max_concurrent INT DEFAULT 100,
    current_load INT DEFAULT 0,
    start_command TEXT DEFAULT 'screen -dmS {screen_name} {command}',
    stop_command TEXT DEFAULT 'screen -S {screen_name} -X quit 2>/dev/null; pkill -9 -f \'{screen_name}\' 2>/dev/null || true',
    is_active TINYINT(1) DEFAULT 1,
    status ENUM('online', 'offline') DEFAULT 'offline',
    cpu_usage DECIMAL(5,2) DEFAULT 0,
    ram_used DECIMAL(10,2) DEFAULT 0,
    ram_total DECIMAL(10,2) DEFAULT 0,
    cpu_model VARCHAR(255) DEFAULT NULL,
    cpu_cores INT DEFAULT 0,
    uptime VARCHAR(100) DEFAULT NULL,
    last_ping DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Server method commands (many-to-many relationship)
CREATE TABLE IF NOT EXISTS server_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_id VARCHAR(36) NOT NULL,
    method_id VARCHAR(50) NOT NULL,
    command TEXT NOT NULL,
    FOREIGN KEY (server_id) REFERENCES attack_servers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_server_method (server_id, method_id)
) ENGINE=InnoDB;

-- Attack methods table
CREATE TABLE IF NOT EXISTS attack_methods (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    tags JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    max_time INT DEFAULT 60,
    max_concurrent INT DEFAULT 1,
    duration_days INT DEFAULT 30,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Plan methods (many-to-many)
CREATE TABLE IF NOT EXISTS plan_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id VARCHAR(50) NOT NULL,
    method_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_method (plan_id, method_id)
) ENGINE=InnoDB;

-- Attacks table
CREATE TABLE IF NOT EXISTS attacks (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    username VARCHAR(50) NOT NULL,
    target VARCHAR(500) NOT NULL,
    port INT DEFAULT 80,
    method VARCHAR(50) NOT NULL,
    duration INT NOT NULL,
    concurrents INT DEFAULT 1,
    server_id VARCHAR(36) DEFAULT NULL,
    server_name VARCHAR(100) DEFAULT NULL,
    status ENUM('running', 'completed', 'stopped', 'failed') DEFAULT 'running',
    screen_name VARCHAR(100) DEFAULT NULL,
    command TEXT DEFAULT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB;

-- News table
CREATE TABLE IF NOT EXISTS news (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('info', 'update', 'alert', 'promo') DEFAULT 'info',
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(20) DEFAULT 'USD',
    crypto_currency VARCHAR(20) DEFAULT NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    transaction_id VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insert default settings
INSERT INTO settings (setting_key, setting_value) VALUES
('global_max_concurrent', '500'),
('maintenance_mode', '0'),
('coinpayments_merchant_id', ''),
('coinpayments_ipn_secret', ''),
('coinpayments_enabled', '0'),
('accepted_crypto', '["BTC","LTC","ETH","USDT","DOGE"]')
ON DUPLICATE KEY UPDATE setting_key=setting_key;

-- Insert default plans
INSERT INTO plans (id, name, price, max_time, max_concurrent, duration_days) VALUES
('free', 'Free', 0, 60, 1, 0),
('basic', 'Basic', 19.99, 300, 3, 30),
('premium', 'Premium', 49.99, 600, 5, 30),
('enterprise', 'Enterprise', 99.99, 1200, 10, 30)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert default methods
INSERT INTO attack_methods (id, name, description, tags) VALUES
('HTTP-GET', 'HTTP GET Flood', 'Basic HTTP GET request flood', '["http", "layer7"]'),
('HTTP-POST', 'HTTP POST Flood', 'HTTP POST request flood with data', '["http", "layer7"]'),
('SLOWLORIS', 'Slowloris', 'Slow HTTP attack that keeps connections open', '["http", "slow", "layer7"]'),
('CF-BYPASS', 'CF Bypass', 'Cloudflare UAM bypass attack', '["http", "bypass", "layer7"]'),
('BROWSER-EMU', 'Browser Emulation', 'Full browser emulation attack', '["http", "browser", "layer7"]')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert default plan methods
INSERT INTO plan_methods (plan_id, method_id) VALUES
('basic', 'HTTP-GET'),
('basic', 'SLOWLORIS'),
('premium', 'HTTP-GET'),
('premium', 'HTTP-POST'),
('premium', 'SLOWLORIS'),
('premium', 'CF-BYPASS'),
('enterprise', 'HTTP-GET'),
('enterprise', 'HTTP-POST'),
('enterprise', 'SLOWLORIS'),
('enterprise', 'CF-BYPASS'),
('enterprise', 'BROWSER-EMU')
ON DUPLICATE KEY UPDATE plan_id=plan_id;

-- Create default admin user (password: admin)
INSERT INTO users (id, username, password_hash, role, plan) VALUES
(UUID(), 'admin', '$2y$10$YourBcryptHashHere', 'admin', 'enterprise')
ON DUPLICATE KEY UPDATE username=username;
