import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne, run } from '../db.ts';
import { generateToken, authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Check duplicate email
    const existing = await queryOne('SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = await run(
      'INSERT INTO users (name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), phone?.trim() || '', password_hash, 'user', 'active']
    );

    const newUser = await queryOne(
      'SELECT user_id, name, email, phone, role, status, created_at FROM users WHERE user_id = ?',
      [result.lastInsertRowid]
    );

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Registration successful. Welcome to Subscribo!',
      user: newUser,
      token,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Registration failed due to a server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const user = await queryOne<any>(
      'SELECT user_id, name, email, phone, password_hash, role, status, created_at FROM users WHERE LOWER(email) = LOWER(?)',
      [email.trim()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'suspended' || user.status === 'inactive') {
      return res.status(403).json({ error: `Your account is ${user.status}. Please contact support.` });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { password_hash, ...safeUser } = user;
    const token = generateToken(safeUser);

    return res.json({
      message: 'Login successful.',
      user: safeUser,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed due to a server error.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await queryOne(
      'SELECT user_id, name, email, phone, role, status, created_at FROM users WHERE user_id = ?',
      [req.user!.user_id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.json({ user });
  } catch (error: any) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// GET /api/auth/demo-users
// Helpful helper for college PBL examiners & demonstration
router.get('/demo-users', async (_req: Request, res: Response) => {
  try {
    const users = await query<any>(
      `SELECT u.user_id, u.name, u.email, u.role, u.status,
              s.status as subscription_status,
              p.plan_name as plan_name
       FROM users u
       LEFT JOIN subscriptions s ON u.user_id = s.user_id
       LEFT JOIN plans p ON s.plan_id = p.plan_id
       ORDER BY u.role DESC, u.user_id ASC`
    );

    return res.json({
      demoAccounts: [
        {
          role: 'admin',
          name: 'System Administrator',
          email: 'admin@subscribo.com',
          password: 'Admin@123',
          description: 'Full administrative access to users, plans, subscriptions, and financial reports.',
        },
        {
          role: 'user',
          name: 'Subscribo User (Standard User)',
          email: 'user@subscribo.com',
          password: 'User@123',
          description: 'Standard user account with active subscription, renewal, and invoice access.',
        },
        {
          role: 'user',
          name: 'Rahul Sharma (Active Standard)',
          email: 'rahul.sharma@example.com',
          password: 'User@123',
          description: 'Active subscription (Standard Plan, 18 days remaining).',
        },
        {
          role: 'user',
          name: 'Arjun Verma (Expiring Soon)',
          email: 'arjun.verma@example.com',
          password: 'User@123',
          description: 'Expiring soon (Basic Plan, 3 days left - ideal for renewal demo).',
        },
        {
          role: 'user',
          name: 'Priya Patel (Annual Pro)',
          email: 'priya.patel@example.com',
          password: 'User@123',
          description: 'Active VIP Annual Pro subscriber with full 4K features.',
        },
      ],
      allUsers: users,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to list demo accounts.' });
  }
});

export default router;
