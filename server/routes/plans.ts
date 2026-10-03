import { Router, Request, Response } from 'express';
import { query, queryOne, run } from '../db.ts';
import { authenticate, requireAdmin, optionalAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/plans - Public/Customer or Admin
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, cycle, sort, includeInactive } = req.query;
    const isAdmin = req.user?.role === 'admin';

    let sql = `
      SELECT p.*,
             COUNT(s.subscription_id) as subscriber_count
      FROM plans p
      LEFT JOIN subscriptions s ON p.plan_id = s.plan_id AND s.status IN ('active', 'expiring_soon')
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter inactive plans for normal users unless explicitly requested by admin
    if (!isAdmin || includeInactive !== 'true') {
      sql += ` AND p.status = 'active'`;
    }

    if (search) {
      sql += ` AND (p.plan_name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (cycle && cycle !== 'all') {
      sql += ` AND p.billing_cycle = ?`;
      params.push(cycle);
    }

    sql += ` GROUP BY p.plan_id`;

    if (sort === 'price_asc') {
      sql += ` ORDER BY p.price ASC`;
    } else if (sort === 'price_desc') {
      sql += ` ORDER BY p.price DESC`;
    } else if (sort === 'popular') {
      sql += ` ORDER BY subscriber_count DESC, p.price ASC`;
    } else {
      sql += ` ORDER BY p.price ASC`;
    }

    const plans = await query<any>(sql, params);

    // Parse JSON features safely
    const formattedPlans = plans.map((plan) => {
      let parsedFeatures: string[] = [];
      try {
        parsedFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
      } catch {
        parsedFeatures = plan.features ? plan.features.split(',').map((f: string) => f.trim()) : [];
      }
      return {
        ...plan,
        features: parsedFeatures,
      };
    });

    return res.json({ plans: formattedPlans });
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    return res.status(500).json({ error: 'Failed to retrieve plans from database.' });
  }
});

// GET /api/plans/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const plan = await queryOne<any>('SELECT * FROM plans WHERE plan_id = ?', [req.params.id]);
    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found.' });
    }

    let parsedFeatures: string[] = [];
    try {
      parsedFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
    } catch {
      parsedFeatures = plan.features ? plan.features.split(',').map((f: string) => f.trim()) : [];
    }

    return res.json({ plan: { ...plan, features: parsedFeatures } });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch plan details.' });
  }
});

// POST /api/plans - Admin only
router.post('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { plan_name, description, price, duration_days, billing_cycle, features, max_users, status } = req.body;

    if (!plan_name || price === undefined || !duration_days) {
      return res.status(400).json({ error: 'Plan name, price, and duration in days are required.' });
    }

    if (Number(price) < 0) {
      return res.status(400).json({ error: 'Price cannot be negative.' });
    }

    const featuresJson = Array.isArray(features) ? JSON.stringify(features) : JSON.stringify([features || 'All standard features']);

    const result = await run(
      `INSERT INTO plans (plan_name, description, price, duration_days, billing_cycle, features, max_users, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plan_name.trim(),
        description?.trim() || '',
        Number(price),
        Number(duration_days),
        billing_cycle || (Number(duration_days) >= 365 ? 'yearly' : 'monthly'),
        featuresJson,
        Number(max_users) || 1,
        status || 'active',
      ]
    );

    const newPlan = await queryOne('SELECT * FROM plans WHERE plan_id = ?', [result.lastInsertRowid]);
    return res.status(201).json({
      message: 'Subscription plan created successfully.',
      plan: {
        ...newPlan,
        features: Array.isArray(features) ? features : [features],
      },
    });
  } catch (error: any) {
    console.error('Create plan error:', error);
    return res.status(500).json({ error: 'Failed to create subscription plan in database.' });
  }
});

// PUT /api/plans/:id - Admin only
router.put('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const planId = req.params.id;
    const { plan_name, description, price, duration_days, billing_cycle, features, max_users, status } = req.body;

    const existing = await queryOne('SELECT * FROM plans WHERE plan_id = ?', [planId]);
    if (!existing) {
      return res.status(404).json({ error: 'Subscription plan not found.' });
    }

    const featuresJson = Array.isArray(features) ? JSON.stringify(features) : JSON.stringify([features || 'Standard features']);

    await run(
      `UPDATE plans
       SET plan_name = ?, description = ?, price = ?, duration_days = ?, billing_cycle = ?, features = ?, max_users = ?, status = ?
       WHERE plan_id = ?`,
      [
        plan_name?.trim() || existing.plan_name,
        description !== undefined ? description : existing.description,
        price !== undefined ? Number(price) : existing.price,
        duration_days !== undefined ? Number(duration_days) : existing.duration_days,
        billing_cycle || existing.billing_cycle,
        featuresJson,
        max_users !== undefined ? Number(max_users) : existing.max_users,
        status || existing.status,
        planId,
      ]
    );

    const updated = await queryOne('SELECT * FROM plans WHERE plan_id = ?', [planId]);
    return res.json({
      message: 'Plan updated successfully.',
      plan: {
        ...updated,
        features: Array.isArray(features) ? features : [],
      },
    });
  } catch (error: any) {
    console.error('Update plan error:', error);
    return res.status(500).json({ error: 'Failed to update plan.' });
  }
});

// PATCH /api/plans/:id/status - Admin only (Toggle active/inactive)
router.patch('/:id/status', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or inactive.' });
    }

    await run('UPDATE plans SET status = ? WHERE plan_id = ?', [status, req.params.id]);
    return res.json({ message: `Plan status updated to ${status}.` });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update plan status.' });
  }
});

// DELETE /api/plans/:id - Admin only (Referential Integrity demonstration)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const planId = req.params.id;

    // Check if subscriptions reference this plan
    const subCheck = await queryOne<any>(
      'SELECT COUNT(*) as sub_count FROM subscriptions WHERE plan_id = ?',
      [planId]
    );

    if (subCheck && subCheck.sub_count > 0) {
      // Demonstrates DBMS Foreign Key Referential Integrity constraint!
      return res.status(400).json({
        error: `Cannot delete plan (Foreign Key Constraint). ${subCheck.sub_count} subscriptions are currently linked to this plan. Please deactivate the plan instead to prevent orphaned records.`,
        suggestedAction: 'deactivate',
      });
    }

    await run('DELETE FROM plans WHERE plan_id = ?', [planId]);
    return res.json({ message: 'Plan deleted successfully from database.' });
  } catch (error: any) {
    console.error('Delete plan error:', error);
    return res.status(500).json({ error: 'Failed to delete plan.' });
  }
});

export default router;
