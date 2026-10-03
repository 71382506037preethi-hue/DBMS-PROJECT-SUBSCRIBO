-- ==============================================================================
-- SUBSCRIBO - Subscription Management System
-- Relational Database Schema (MySQL & SQLite Standard Compliant DDL)
-- Course: Database Management Systems (DBMS) College PBL Project
-- ==============================================================================

-- 1. USERS TABLE
-- Stores credentials, personal details, roles (customer/admin), and status.
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK(role IN ('customer', 'user', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PLANS TABLE
-- Defines subscription packages, pricing, durations, features, and user limits.
CREATE TABLE IF NOT EXISTS plans (
    plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK(price >= 0),
    duration_days INTEGER NOT NULL CHECK(duration_days > 0),
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK(billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    features TEXT NOT NULL,
    max_users INTEGER NOT NULL DEFAULT 1 CHECK(max_users >= 1),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. SUBSCRIPTIONS TABLE
-- Links a user to a selected plan with start/end validity, status, and renewal preference.
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'expiring_soon', 'expired', 'cancelled', 'pending')),
    auto_renew INTEGER NOT NULL DEFAULT 1 CHECK(auto_renew IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (plan_id) REFERENCES plans(plan_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 4. PAYMENTS TABLE
-- Records billing transactions, simulated gateway reference IDs, payment methods, and statuses.
CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK(amount >= 0),
    payment_method VARCHAR(50) NOT NULL CHECK(payment_method IN ('UPI', 'Credit/Debit Card', 'Net Banking')),
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'successful' CHECK(payment_status IN ('successful', 'failed', 'pending', 'refunded')),
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 5. SUBSCRIPTION HISTORY TABLE
-- Audit log tracking lifecycle events: plan creation, renewals, upgrades, cancellations.
CREATE TABLE IF NOT EXISTS subscription_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL CHECK(action IN ('Created', 'Renewed', 'Upgraded', 'Cancelled', 'Status Changed', 'Reactivated')),
    old_plan_id INTEGER,
    new_plan_id INTEGER,
    notes TEXT,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (old_plan_id) REFERENCES plans(plan_id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (new_plan_id) REFERENCES plans(plan_id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 6. SYSTEM SETTINGS TABLE
-- Configuration parameters like threshold days for "expiring soon" alerts.
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- PERFORMANCE INDEXES (Demonstrates Database Optimization Concepts)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subs_dates ON subscriptions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payments_sub ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_txn ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_history_sub ON subscription_history(subscription_id);
