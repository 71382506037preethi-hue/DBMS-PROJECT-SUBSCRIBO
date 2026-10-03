-- ==============================================================================
-- SUBSCRIBO - Sample Seed Data
-- Passwords:
-- admin@subscribo.com -> admin123 (bcrypt hash)
-- All customer passwords -> password123 (bcrypt hash)
-- bcrypt hash for 'admin123': $2a$10$wB5pGf3vK2eA8uG3YnZ5xO3E7BqmC8R5jH6L2N9Y1Q0X7P4W8E5eO (or generated during seed)
-- ==============================================================================

-- System Settings
INSERT OR REPLACE INTO system_settings (setting_key, setting_value, description) VALUES
('expiring_soon_days', '7', 'Threshold in days to flag subscriptions as expiring soon'),
('platform_currency', 'INR', 'Currency symbol and code'),
('currency_symbol', '₹', 'Display currency symbol'),
('auto_renewal_enabled', 'true', 'Global auto renewal scheduler toggle');

-- Plans
INSERT OR REPLACE INTO plans (plan_id, plan_name, description, price, duration_days, billing_cycle, features, max_users, status) VALUES
(1, 'Basic Plan', 'Essential entertainment and tools for single users on mobile or desktop.', 199.00, 30, 'monthly', '["1 Active Device", "HD 720p Quality", "Standard Content Library", "Mobile & Web Access", "Community Support"]', 1, 'active'),
(2, 'Standard Plan', 'Best seller for couples or small families with multi-device high definition access.', 399.00, 30, 'monthly', '["2 Concurrent Devices", "Full HD 1080p Quality", "Ad-Free Streaming", "Unlimited Downloads", "Priority Email Support"]', 2, 'active'),
(3, 'Premium Plan', 'Ultimate 4K HDR audio-visual experience with family sharing and zero restrictions.', 699.00, 30, 'monthly', '["4 Concurrent Devices", "Ultra HD 4K + Dolby Atmos", "Ad-Free Experience", "Unlimited Downloads", "24/7 VIP Concierge Support", "Family Profiles"]', 4, 'active'),
(4, 'Annual Pro Pass', 'Maximum savings package offering full Premium benefits for a full 365 days.', 4999.00, 365, 'yearly', '["4 Concurrent Devices", "Ultra HD 4K + Dolby Atmos", "2 Months FREE Included", "Unlimited Downloads", "Partner Discounts & Perks", "Early Access to New Releases"]', 4, 'active');
