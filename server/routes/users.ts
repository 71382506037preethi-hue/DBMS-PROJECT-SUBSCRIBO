import { Router, Response } from 'express';
import { query, queryOne, run } from '../db.ts';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/users - Admin only
router.get('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, status, search } = req.query;

    let sql = `
      SELECT u.user_id, u.name, u.email, u.phone, u.role, u.status, u.created_at,
             COUNT(DISTINCT s.subscription_id) as total_subscriptions,
             SUM(CASE WHEN p.payment_status = 'successful' THEN p.amount ELSE 0 END) as total_spent,
             MAX(s.end_date) as latest_subscription_end,
             (SELECT status FROM subscriptions WHERE user_id = u.user_id ORDER BY created_at DESC LIMIT 1) as current_subscription_status,
             (SELECT pl.plan_name FROM subscriptions sub JOIN plans pl ON sub.plan_id = pl.plan_id WHERE sub.user_id = u.user_id ORDER BY sub.created_at DESC LIMIT 1) as current_plan_name
      FROM users u
      LEFT JOIN subscriptions s ON u.user_id = s.user_id
      LEFT JOIN payments p ON u.user_id = p.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role && role !== 'all') {
      sql += ` AND u.role = ?`;
      params.push(role);
    }

    if (status && status !== 'all') {
      sql += ` AND u.status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` GROUP BY u.user_id ORDER BY u.created_at DESC`;

    const users = await query<any>(sql, params);
    return res.json({ users });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// GET /api/users/:id - User details with subscriptions and payment history
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params.id;
    const isAdmin = req.user!.role === 'admin';

    if (!isAdmin && Number(userId) !== req.user!.user_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const user = await queryOne<any>(
      `SELECT user_id, name, email, phone, role, status, created_at 
       FROM users WHERE user_id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const subscriptions = await query<any>(
      `SELECT s.*, p.plan_name, p.price, p.billing_cycle, p.duration_days
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.plan_id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`,
      [userId]
    );

    const payments = await query<any>(
      `SELECT p.*, pl.plan_name
       FROM payments p
       JOIN subscriptions s ON p.subscription_id = s.subscription_id
       JOIN plans pl ON s.plan_id = pl.plan_id
       WHERE p.user_id = ?
       ORDER BY p.payment_date DESC`,
      [userId]
    );

    return res.json({
      user,
      subscriptions,
      payments,
    });
  } catch (error: any) {
    console.error('Fetch user detail error:', error);
    return res.status(500).json({ error: 'Failed to retrieve user details.' });
  }
});

// PATCH /api/users/:id/status - Toggle activate/deactivate/suspend (Admin only)
router.patch('/:id/status', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    // Prevent deactivating own admin account
    if (userId === req.user!.user_id) {
      return res.status(400).json({ error: 'You cannot deactivate your own logged-in administrator account.' });
    }

    await run('UPDATE users SET status = ? WHERE user_id = ?', [status, userId]);
    return res.json({ message: `User status updated to ${status}.` });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// PUT /api/users/:id - Update user profile
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const isAdmin = req.user!.role === 'admin';
    const { name, phone, role } = req.body;

    if (!isAdmin && userId !== req.user!.user_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const existing = await queryOne('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updateRole = isAdmin && role && ['customer', 'admin'].includes(role) ? role : existing.role;

    await run(
      'UPDATE users SET name = ?, phone = ?, role = ? WHERE user_id = ?',
      [name?.trim() || existing.name, phone?.trim() || existing.phone, updateRole, userId]
    );

    const updated = await queryOne('SELECT user_id, name, email, phone, role, status FROM users WHERE user_id = ?', [userId]);
    return res.json({ message: 'Profile updated successfully.', user: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export default router;
