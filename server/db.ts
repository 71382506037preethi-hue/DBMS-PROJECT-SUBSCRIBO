import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'subscribo.db');
const SCHEMA_PATH = path.join(process.cwd(), 'database', 'schema.sql');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      dbInstance.run('PRAGMA foreign_keys = ON;');
      console.log('Loaded existing database from disk.');
      ensureDefaultAccounts(dbInstance);
      saveDatabase(dbInstance);
      return dbInstance;
    } catch (err) {
      console.error('Error loading existing database file, reinitializing...', err);
    }
  }

  // Initialize fresh database
  dbInstance = new SQL.Database();
  dbInstance.run('PRAGMA foreign_keys = ON;');
  await initDatabaseSchemaAndSeed(dbInstance);
  ensureDefaultAccounts(dbInstance);
  saveDatabase(dbInstance);
  return dbInstance;
}

export function saveDatabase(db?: Database) {
  const targetDb = db || dbInstance;
  if (!targetDb) return;
  try {
    const data = targetDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

export function ensureUsersSchemaAllowsUserRole(db: Database) {
  try {
    const res = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
    const sql = (res[0]?.values[0]?.[0] as string) || '';
    if (sql && !sql.includes("'user'")) {
      console.log('Migrating users table schema to support role "user"...');
      db.run('PRAGMA foreign_keys = OFF;');
      db.run(`
        CREATE TABLE IF NOT EXISTS users_temp (
          user_id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          phone VARCHAR(20),
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK(role IN ('customer', 'user', 'admin')),
          status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      db.run(`INSERT INTO users_temp (user_id, name, email, phone, password_hash, role, status, created_at)
              SELECT user_id, name, email, phone, password_hash, role, status, created_at FROM users;`);
      db.run('DROP TABLE users;');
      db.run('ALTER TABLE users_temp RENAME TO users;');
      db.run('PRAGMA foreign_keys = ON;');
      console.log('Users table migrated successfully.');
    }
  } catch (err) {
    console.error('Error migrating users table:', err);
  }
}

export function ensureDefaultAccounts(db: Database) {
  ensureUsersSchemaAllowsUserRole(db);

  const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);
  const userPasswordHash = bcrypt.hashSync('User@123', 10);

  // 1. Ensure Admin Account: admin@subscribo.com / Admin@123 / admin
  const adminCheck = db.exec("SELECT user_id FROM users WHERE LOWER(email) = 'admin@subscribo.com'");
  if (adminCheck.length > 0 && adminCheck[0].values.length > 0) {
    const adminId = adminCheck[0].values[0][0];
    db.run(
      "UPDATE users SET password_hash = ?, role = 'admin', status = 'active', name = 'System Administrator' WHERE user_id = ?",
      [adminPasswordHash, adminId]
    );
  } else {
    db.run(
      "INSERT INTO users (name, email, phone, password_hash, role, status) VALUES ('System Administrator', 'admin@subscribo.com', '+91 98765 43210', ?, 'admin', 'active')",
      [adminPasswordHash]
    );
  }

  // 2. Ensure User Account: user@subscribo.com / User@123 / user
  let userId: number;
  const userCheck = db.exec("SELECT user_id FROM users WHERE LOWER(email) = 'user@subscribo.com'");
  if (userCheck.length > 0 && userCheck[0].values.length > 0) {
    userId = userCheck[0].values[0][0] as number;
    db.run(
      "UPDATE users SET password_hash = ?, role = 'user', status = 'active', name = 'Subscribo User' WHERE user_id = ?",
      [userPasswordHash, userId]
    );
  } else {
    db.run(
      "INSERT INTO users (name, email, phone, password_hash, role, status) VALUES ('Subscribo User', 'user@subscribo.com', '+91 98111 22334', ?, 'user', 'active')",
      [userPasswordHash]
    );
    const idRes = db.exec("SELECT user_id FROM users WHERE LOWER(email) = 'user@subscribo.com'");
    userId = idRes[0].values[0][0] as number;
  }

  // Ensure user@subscribo.com has at least one active subscription and payment history
  const subCheck = db.exec(`SELECT subscription_id FROM subscriptions WHERE user_id = ${userId}`);
  if (subCheck.length === 0 || subCheck[0].values.length === 0) {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 12);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 18);
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    db.run(`
      INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, status, auto_renew)
      VALUES (${userId}, 2, '${formatDate(startDate)}', '${formatDate(endDate)}', 'active', 1)
    `);

    const newSubRes = db.exec(`SELECT subscription_id FROM subscriptions WHERE user_id = ${userId} ORDER BY subscription_id DESC LIMIT 1`);
    const newSubId = newSubRes[0]?.values[0]?.[0] || 1;

    db.run(`
      INSERT INTO payments (subscription_id, user_id, amount, payment_method, transaction_id, payment_date, payment_status)
      VALUES (${newSubId}, ${userId}, 399.00, 'UPI', 'TXN-SUB-${Date.now().toString().slice(-6)}', '${formatDate(startDate)} 10:30:00', 'successful')
    `);

    db.run(`
      INSERT INTO subscription_history (subscription_id, action, old_plan_id, new_plan_id, notes, action_date)
      VALUES (${newSubId}, 'Created', NULL, 2, 'Initial Standard Plan subscription created via UPI', '${formatDate(startDate)} 10:30:00')
    `);
  }
}

export async function initDatabaseSchemaAndSeed(db: Database) {
  console.log('Initializing database schema and seed data...');
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.run(schemaSql);

  // Check if users exist
  const checkUser = db.exec("SELECT COUNT(*) as cnt FROM users");
  const count = checkUser[0]?.values[0]?.[0] as number;
  if (count > 0) {
    return;
  }

  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const userHash = bcrypt.hashSync('User@123', 10);

  // Seed System Settings
  db.run(`
    INSERT OR REPLACE INTO system_settings (setting_key, setting_value, description) VALUES
    ('expiring_soon_days', '7', 'Threshold in days to flag subscriptions as expiring soon'),
    ('platform_currency', 'INR', 'Currency code'),
    ('currency_symbol', '₹', 'Display currency symbol'),
    ('auto_renewal_enabled', 'true', 'Global auto renewal setting');
  `);

  // Seed Plans
  db.run(`
    INSERT INTO plans (plan_id, plan_name, description, price, duration_days, billing_cycle, features, max_users, status) VALUES
    (1, 'Basic Plan', 'Essential entertainment and tools for single users on mobile or desktop.', 199.00, 30, 'monthly', '["1 Active Device", "HD 720p Quality", "Standard Content Library", "Mobile & Web Access", "Community Support"]', 1, 'active'),
    (2, 'Standard Plan', 'Best seller for couples or small families with multi-device high definition access.', 399.00, 30, 'monthly', '["2 Concurrent Devices", "Full HD 1080p Quality", "Ad-Free Streaming", "Unlimited Downloads", "Priority Email Support"]', 2, 'active'),
    (3, 'Premium Plan', 'Ultimate 4K HDR audio-visual experience with family sharing and zero restrictions.', 699.00, 30, 'monthly', '["4 Concurrent Devices", "Ultra HD 4K + Dolby Atmos", "Ad-Free Experience", "Unlimited Downloads", "24/7 VIP Concierge Support", "Family Profiles"]', 4, 'active'),
    (4, 'Annual Pro Pass', 'Maximum savings package offering full Premium benefits for a full 365 days.', 4999.00, 365, 'yearly', '["4 Concurrent Devices", "Ultra HD 4K + Dolby Atmos", "2 Months FREE Included", "Unlimited Downloads", "Partner Discounts & Perks", "Early Access to New Releases"]', 4, 'active');
  `);

  // Seed Users: Featuring admin@subscribo.com / Admin@123 and user@subscribo.com / User@123
  db.run(`
    INSERT INTO users (user_id, name, email, phone, password_hash, role, status) VALUES
    (1, 'System Administrator', 'admin@subscribo.com', '+91 98765 43210', '${adminHash}', 'admin', 'active'),
    (2, 'Subscribo User', 'user@subscribo.com', '+91 98111 22334', '${userHash}', 'user', 'active'),
    (3, 'Rahul Sharma', 'rahul.sharma@example.com', '+91 98111 55667', '${userHash}', 'user', 'active'),
    (4, 'Priya Patel', 'priya.patel@example.com', '+91 98222 33445', '${userHash}', 'user', 'active'),
    (5, 'Arjun Verma', 'arjun.verma@example.com', '+91 98333 44556', '${userHash}', 'user', 'active'),
    (6, 'Ananya Sen', 'ananya.sen@example.com', '+91 98444 55667', '${userHash}', 'user', 'active'),
    (7, 'Vikram Singh', 'vikram.singh@example.com', '+91 98555 66778', '${userHash}', 'user', 'inactive');
  `);

  // Realistic dynamic dates based on today
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const sub1Start = new Date(today);
  sub1Start.setDate(today.getDate() - 12);
  const sub1End = new Date(today);
  sub1End.setDate(today.getDate() + 18); // Active

  const sub2Start = new Date(today);
  sub2Start.setDate(today.getDate() - 60);
  const sub2End = new Date(today);
  sub2End.setDate(today.getDate() + 305); // Active Annual

  const sub3Start = new Date(today);
  sub3Start.setDate(today.getDate() - 27);
  const sub3End = new Date(today);
  sub3End.setDate(today.getDate() + 3); // Expiring soon!

  const sub4Start = new Date(today);
  sub4Start.setDate(today.getDate() - 45);
  const sub4End = new Date(today);
  sub4End.setDate(today.getDate() - 15); // Expired

  const sub5Start = new Date(today);
  sub5Start.setDate(today.getDate() - 20);
  const sub5End = new Date(today);
  sub5End.setDate(today.getDate() + 10); // Cancelled

  // Seed Subscriptions
  db.run(`
    INSERT INTO subscriptions (subscription_id, user_id, plan_id, start_date, end_date, status, auto_renew) VALUES
    (1, 2, 2, '${formatDate(sub1Start)}', '${formatDate(sub1End)}', 'active', 1),
    (2, 4, 4, '${formatDate(sub2Start)}', '${formatDate(sub2End)}', 'active', 1),
    (3, 5, 1, '${formatDate(sub3Start)}', '${formatDate(sub3End)}', 'expiring_soon', 1),
    (4, 6, 2, '${formatDate(sub4Start)}', '${formatDate(sub4End)}', 'expired', 0),
    (5, 7, 3, '${formatDate(sub5Start)}', '${formatDate(sub5End)}', 'cancelled', 0);
  `);

  // Seed Payments
  db.run(`
    INSERT INTO payments (payment_id, subscription_id, user_id, amount, payment_method, transaction_id, payment_date, payment_status) VALUES
    (1, 1, 2, 399.00, 'UPI', 'TXN-SUB-108291', '${formatDate(sub1Start)} 10:30:00', 'successful'),
    (2, 2, 4, 4999.00, 'Credit/Debit Card', 'TXN-SUB-294817', '${formatDate(sub2Start)} 14:15:22', 'successful'),
    (3, 3, 5, 199.00, 'Net Banking', 'TXN-SUB-384729', '${formatDate(sub3Start)} 09:45:10', 'successful'),
    (4, 4, 6, 399.00, 'UPI', 'TXN-SUB-492019', '${formatDate(sub4Start)} 18:20:00', 'successful'),
    (5, 5, 7, 699.00, 'Credit/Debit Card', 'TXN-SUB-582910', '${formatDate(sub5Start)} 11:05:40', 'successful');
  `);

  // Seed Subscription History
  db.run(`
    INSERT INTO subscription_history (history_id, subscription_id, action, old_plan_id, new_plan_id, notes, action_date) VALUES
    (1, 1, 'Created', NULL, 2, 'Initial Standard Plan subscription created via UPI', '${formatDate(sub1Start)} 10:30:00'),
    (2, 2, 'Created', NULL, 4, 'Annual Pro Pass subscription initiated with promotional discount', '${formatDate(sub2Start)} 14:15:22'),
    (3, 3, 'Created', NULL, 1, 'Basic Plan started', '${formatDate(sub3Start)} 09:45:10'),
    (4, 4, 'Created', NULL, 2, 'Standard Plan started', '${formatDate(sub4Start)} 18:20:00'),
    (5, 4, 'Status Changed', 2, 2, 'Subscription expired on end date', '${formatDate(sub4End)} 00:00:01'),
    (6, 5, 'Created', NULL, 3, 'Premium Plan subscribed', '${formatDate(sub5Start)} 11:05:40'),
    (7, 5, 'Cancelled', 3, 3, 'User requested subscription cancellation from dashboard', '${formatDate(today)} 08:30:00');
  `);

  console.log('Database seeded successfully with initial data!');
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function run(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
  const db = await getDb();
  db.run(sql, params);
  const res = db.exec("SELECT last_insert_rowid() as id, changes() as cnt");
  const lastInsertRowid = (res[0]?.values[0]?.[0] as number) || 0;
  const changes = (res[0]?.values[0]?.[1] as number) || 0;
  saveDatabase(db);
  return { lastInsertRowid, changes };
}

export async function runTransaction<T>(fn: (db: Database) => Promise<T>): Promise<T> {
  const db = await getDb();
  db.run('BEGIN TRANSACTION;');
  try {
    const result = await fn(db);
    db.run('COMMIT;');
    saveDatabase(db);
    return result;
  } catch (error) {
    db.run('ROLLBACK;');
    throw error;
  }
}

export async function refreshSubscriptionStatuses(expiringSoonDays?: number): Promise<void> {
  const db = await getDb();
  let days = expiringSoonDays;
  if (!days) {
    const setting = await queryOne<{ setting_value: string }>(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'expiring_soon_days'"
    );
    days = setting ? parseInt(setting.setting_value, 10) : 7;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Expired check: end_date < today and not already expired or cancelled
  db.run(`
    UPDATE subscriptions 
    SET status = 'expired' 
    WHERE end_date < date('now') 
      AND status NOT IN ('expired', 'cancelled');
  `);

  // Expiring soon check: end_date >= today and end_date <= date('now', '+X days')
  db.run(`
    UPDATE subscriptions 
    SET status = 'expiring_soon' 
    WHERE end_date >= date('now') 
      AND end_date <= date('now', '+${days} days')
      AND status = 'active';
  `);

  saveDatabase(db);
}

export async function resetDatabaseToDefault(): Promise<void> {
  const SQL = await initSqlJs();
  dbInstance = new SQL.Database();
  dbInstance.run('PRAGMA foreign_keys = ON;');
  await initDatabaseSchemaAndSeed(dbInstance);
  ensureDefaultAccounts(dbInstance);
  saveDatabase(dbInstance);
}
