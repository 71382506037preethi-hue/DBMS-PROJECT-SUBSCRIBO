import { Router, Response } from 'express';
import { query, queryOne, run, refreshSubscriptionStatuses, runTransaction } from '../db.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/subscriptions - List subscriptions for logged-in user or all for admin
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await refreshSubscriptionStatuses();

    const isAdmin = req.user!.role === 'admin';
    const { status, search, userId } = req.query;

    let sql = `
      SELECT s.subscription_id, s.user_id, s.plan_id, s.start_date, s.end_date, s.status, s.auto_renew, s.created_at,
             p.plan_name, p.price, p.billing_cycle, p.duration_days, p.features, p.max_users,
             u.name as user_name, u.email as user_email, u.phone as user_phone,
             CAST(ROUND(julianday(s.end_date) - julianday('now')) AS INTEGER) as days_remaining,
             (SELECT COUNT(*) FROM payments WHERE subscription_id = s.subscription_id AND payment_status = 'successful') as payment_count,
             (SELECT SUM(amount) FROM payments WHERE subscription_id = s.subscription_id AND payment_status = 'successful') as total_paid
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.plan_id
      JOIN users u ON s.user_id = u.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Customer can only view their own subscriptions
    if (!isAdmin) {
      sql += ` AND s.user_id = ?`;
      params.push(req.user!.user_id);
    } else if (userId) {
      sql += ` AND s.user_id = ?`;
      params.push(userId);
    }

    if (status && status !== 'all') {
      sql += ` AND s.status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (p.plan_name LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR s.subscription_id LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY s.created_at DESC`;

    const subscriptions = await query<any>(sql, params);

    const formatted = subscriptions.map((sub) => {
      let parsedFeatures: string[] = [];
      try {
        parsedFeatures = typeof sub.features === 'string' ? JSON.parse(sub.features) : sub.features;
      } catch {
        parsedFeatures = sub.features ? sub.features.split(',').map((f: string) => f.trim()) : [];
      }
      return {
        ...sub,
        features: parsedFeatures,
        days_remaining: sub.days_remaining !== null ? Math.max(0, sub.days_remaining) : 0,
      };
    });

    return res.json({ subscriptions: formatted });
  } catch (error: any) {
    console.error('Fetch subscriptions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve subscriptions from database.' });
  }
});

// GET /api/subscriptions/:id - Detailed view
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await refreshSubscriptionStatuses();
    const subId = req.params.id;
    const isAdmin = req.user!.role === 'admin';

    const sub = await queryOne<any>(
      `SELECT s.*,
              p.plan_name, p.description as plan_description, p.price, p.billing_cycle, p.duration_days, p.features, p.max_users,
              u.name as user_name, u.email as user_email, u.phone as user_phone,
              CAST(ROUND(julianday(s.end_date) - julianday('now')) AS INTEGER) as days_remaining
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.plan_id
       JOIN users u ON s.user_id = u.user_id
       WHERE s.subscription_id = ?`,
      [subId]
    );

    if (!sub) {
      return res.status(404).json({ error: 'Subscription record not found.' });
    }

    // Role check
    if (!isAdmin && sub.user_id !== req.user!.user_id) {
      return res.status(403).json({ error: 'Unauthorized access to this subscription.' });
    }

    // Fetch payments for this subscription
    const payments = await query<any>(
      `SELECT * FROM payments WHERE subscription_id = ? ORDER BY payment_date DESC`,
      [subId]
    );

    // Fetch history audit trail
    const history = await query<any>(
      `SELECT sh.*, 
              op.plan_name as old_plan_name, 
              np.plan_name as new_plan_name
       FROM subscription_history sh
       LEFT JOIN plans op ON sh.old_plan_id = op.plan_id
       LEFT JOIN plans np ON sh.new_plan_id = np.plan_id
       WHERE sh.subscription_id = ?
       ORDER BY sh.action_date DESC`,
      [subId]
    );

    let parsedFeatures: string[] = [];
    try {
      parsedFeatures = typeof sub.features === 'string' ? JSON.parse(sub.features) : sub.features;
    } catch {
      parsedFeatures = [];
    }

    return res.json({
      subscription: {
        ...sub,
        features: parsedFeatures,
        days_remaining: sub.days_remaining !== null ? Math.max(0, sub.days_remaining) : 0,
      },
      payments,
      history,
    });
  } catch (error: any) {
    console.error('Fetch subscription details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve subscription details.' });
  }
});

// POST /api/subscriptions - Subscribe to a plan (with simulated payment)
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { plan_id, payment_method, auto_renew } = req.body;
    const userId = req.user!.user_id;

    if (!plan_id) {
      return res.status(400).json({ error: 'Please select a plan to subscribe.' });
    }

    const plan = await queryOne<any>('SELECT * FROM plans WHERE plan_id = ? AND status = "active"', [plan_id]);
    if (!plan) {
      return res.status(404).json({ error: 'Selected plan is not available or inactive.' });
    }

    const validMethods = ['UPI', 'Credit/Debit Card', 'Net Banking'];
    const chosenMethod = validMethods.includes(payment_method) ? payment_method : 'UPI';

    const today = new Date();
    const startDateStr = today.toISOString().split('T')[0];
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + Number(plan.duration_days));
    const endDateStr = endDate.toISOString().split('T')[0];

    const txnId = `TXN-SUB-${Math.floor(100000 + Math.random() * 900000)}`;

    // Execute atomic transaction for DBMS integrity
    const result = await runTransaction(async (db) => {
      // 1. Insert Subscription
      db.run(
        `INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, status, auto_renew)
         VALUES (?, ?, ?, ?, 'active', ?)`,
        [userId, plan_id, startDateStr, endDateStr, auto_renew ? 1 : 0]
      );
      const subRes = db.exec("SELECT last_insert_rowid() as id");
      const subscriptionId = subRes[0].values[0][0] as number;

      // 2. Insert Payment
      db.run(
        `INSERT INTO payments (subscription_id, user_id, amount, payment_method, transaction_id, payment_date, payment_status)
         VALUES (?, ?, ?, ?, ?, datetime('now'), 'successful')`,
        [subscriptionId, userId, plan.price, chosenMethod, txnId]
      );
      const payRes = db.exec("SELECT last_insert_rowid() as id");
      const paymentId = payRes[0].values[0][0] as number;

      // 3. Insert Subscription History audit trail
      db.run(
        `INSERT INTO subscription_history (subscription_id, action, old_plan_id, new_plan_id, notes, action_date)
         VALUES (?, 'Created', NULL, ?, ?, datetime('now'))`,
        [
          subscriptionId,
          plan_id,
          `New subscription to ${plan.plan_name} (${plan.billing_cycle}) via ${chosenMethod}. Transaction ID: ${txnId}`,
        ]
      );

      return { subscriptionId, paymentId, txnId };
    });

    return res.status(201).json({
      message: `Successfully subscribed to ${plan.plan_name}!`,
      subscription_id: result.subscriptionId,
      payment_id: result.paymentId,
      transaction_id: result.txnId,
      amount: plan.price,
      end_date: endDateStr,
    });
  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return res.status(500).json({ error: 'Failed to process subscription and payment.' });
  }
});

// POST /api/subscriptions/:id/renew - Renew subscription
router.post('/:id/renew', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subId = req.params.id;
    const { payment_method } = req.body;
    const userId = req.user!.user_id;
    const isAdmin = req.user!.role === 'admin';

    const sub = await queryOne<any>(
      `SELECT s.*, p.plan_name, p.price, p.duration_days 
       FROM subscriptions s 
       JOIN plans p ON s.plan_id = p.plan_id 
       WHERE s.subscription_id = ?`,
      [subId]
    );

    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    if (!isAdmin && sub.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to renew this subscription.' });
    }

    const today = new Date();
    const currentEnd = new Date(sub.end_date);
    let newEnd: Date;

    // If subscription has not expired yet, extend from current end date!
    if (currentEnd > today) {
      newEnd = new Date(currentEnd);
      newEnd.setDate(newEnd.getDate() + Number(sub.duration_days));
    } else {
      // If already expired, start from today
      newEnd = new Date(today);
      newEnd.setDate(today.getDate() + Number(sub.duration_days));
    }

    const newEndStr = newEnd.toISOString().split('T')[0];
    const txnId = `TXN-REN-${Math.floor(100000 + Math.random() * 900000)}`;
    const method = payment_method || 'UPI';

    await runTransaction(async (db) => {
      // 1. Update subscription status and end_date
      db.run(
        `UPDATE subscriptions 
         SET end_date = ?, status = 'active', auto_renew = 1 
         WHERE subscription_id = ?`,
        [newEndStr, subId]
      );

      // 2. Insert new payment record
      db.run(
        `INSERT INTO payments (subscription_id, user_id, amount, payment_method, transaction_id, payment_date, payment_status)
         VALUES (?, ?, ?, ?, ?, datetime('now'), 'successful')`,
        [subId, sub.user_id, sub.price, method, txnId]
      );

      // 3. Insert history record
      db.run(
        `INSERT INTO subscription_history (subscription_id, action, old_plan_id, new_plan_id, notes, action_date)
         VALUES (?, 'Renewed', ?, ?, ?, datetime('now'))`,
        [
          subId,
          sub.plan_id,
          sub.plan_id,
          `Subscription renewed for ${sub.duration_days} days until ${newEndStr} via ${method}. Txn: ${txnId}`,
        ]
      );
    });

    return res.json({
      message: `Subscription successfully renewed until ${newEndStr}!`,
      new_end_date: newEndStr,
      transaction_id: txnId,
    });
  } catch (error: any) {
    console.error('Renew error:', error);
    return res.status(500).json({ error: 'Failed to renew subscription.' });
  }
});

// POST /api/subscriptions/:id/upgrade - Upgrade plan
router.post('/:id/upgrade', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subId = req.params.id;
    const { new_plan_id, payment_method } = req.body;
    const userId = req.user!.user_id;
    const isAdmin = req.user!.role === 'admin';

    if (!new_plan_id) {
      return res.status(400).json({ error: 'Please choose a new plan to upgrade.' });
    }

    const sub = await queryOne<any>(
      `SELECT s.*, p.plan_name as current_plan_name, p.price as current_price 
       FROM subscriptions s 
       JOIN plans p ON s.plan_id = p.plan_id 
       WHERE s.subscription_id = ?`,
      [subId]
    );

    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    if (!isAdmin && sub.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to upgrade this subscription.' });
    }

    const newPlan = await queryOne<any>('SELECT * FROM plans WHERE plan_id = ? AND status = "active"', [new_plan_id]);
    if (!newPlan) {
      return res.status(404).json({ error: 'Target plan not found or is inactive.' });
    }

    const today = new Date();
    const newEnd = new Date(today);
    newEnd.setDate(today.getDate() + Number(newPlan.duration_days));
    const newEndStr = newEnd.toISOString().split('T')[0];

    const txnId = `TXN-UPG-${Math.floor(100000 + Math.random() * 900000)}`;
    const method = payment_method || 'UPI';

    await runTransaction(async (db) => {
      // 1. Update subscription plan and end date
      db.run(
        `UPDATE subscriptions 
         SET plan_id = ?, start_date = date('now'), end_date = ?, status = 'active'
         WHERE subscription_id = ?`,
        [new_plan_id, newEndStr, subId]
      );

      // 2. Insert payment record
      db.run(
        `INSERT INTO payments (subscription_id, user_id, amount, payment_method, transaction_id, payment_date, payment_status)
         VALUES (?, ?, ?, ?, ?, datetime('now'), 'successful')`,
        [subId, sub.user_id, newPlan.price, method, txnId]
      );

      // 3. Insert history record
      db.run(
        `INSERT INTO subscription_history (subscription_id, action, old_plan_id, new_plan_id, notes, action_date)
         VALUES (?, 'Upgraded', ?, ?, ?, datetime('now'))`,
        [
          subId,
          sub.plan_id,
          new_plan_id,
          `Upgraded from ${sub.current_plan_name} to ${newPlan.plan_name}. Valid until ${newEndStr}. Txn: ${txnId}`,
        ]
      );
    });

    return res.json({
      message: `Successfully upgraded to ${newPlan.plan_name}!`,
      new_end_date: newEndStr,
      transaction_id: txnId,
    });
  } catch (error: any) {
    console.error('Upgrade error:', error);
    return res.status(500).json({ error: 'Failed to upgrade subscription.' });
  }
});

// POST /api/subscriptions/:id/cancel - Cancel subscription
router.post('/:id/cancel', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subId = req.params.id;
    const { reason } = req.body;
    const userId = req.user!.user_id;
    const isAdmin = req.user!.role === 'admin';

    const sub = await queryOne<any>(
      `SELECT s.*, p.plan_name 
       FROM subscriptions s 
       JOIN plans p ON s.plan_id = p.plan_id 
       WHERE s.subscription_id = ?`,
      [subId]
    );

    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    if (!isAdmin && sub.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to cancel this subscription.' });
    }

    if (sub.status === 'cancelled') {
      return res.status(400).json({ error: 'Subscription is already cancelled.' });
    }

    await runTransaction(async (db) => {
      // Update database status
      db.run(
        `UPDATE subscriptions 
         SET status = 'cancelled', auto_renew = 0 
         WHERE subscription_id = ?`,
        [subId]
      );

      // Audit trail record in subscription_history
      db.run(
        `INSERT INTO subscription_history (subscription_id, action, old_plan_id, new_plan_id, notes, action_date)
         VALUES (?, 'Cancelled', ?, ?, ?, datetime('now'))`,
        [
          subId,
          sub.plan_id,
          sub.plan_id,
          `Cancellation requested by ${isAdmin ? 'Admin' : 'Customer'}. Reason: ${reason || 'User opted out'}.`,
        ]
      );
    });

    return res.json({
      message: 'Subscription has been cancelled. Your access will remain until the billing period concludes.',
      subscription_id: subId,
      status: 'cancelled',
    });
  } catch (error: any) {
    console.error('Cancel error:', error);
    return res.status(500).json({ error: 'Failed to cancel subscription.' });
  }
});

// PATCH /api/subscriptions/:id/auto-renew - Toggle auto-renew
router.patch('/:id/auto-renew', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subId = req.params.id;
    const { auto_renew } = req.body;
    const userId = req.user!.user_id;
    const isAdmin = req.user!.role === 'admin';

    const sub = await queryOne<any>('SELECT * FROM subscriptions WHERE subscription_id = ?', [subId]);
    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    if (!isAdmin && sub.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const val = auto_renew ? 1 : 0;
    await run('UPDATE subscriptions SET auto_renew = ? WHERE subscription_id = ?', [val, subId]);

    return res.json({
      message: `Auto-renewal has been turned ${val ? 'ON' : 'OFF'}.`,
      auto_renew: val,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update auto-renewal setting.' });
  }
});

export default router;
