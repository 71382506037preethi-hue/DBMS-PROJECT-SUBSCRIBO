import { Router, Response } from 'express';
import { query, queryOne } from '../db.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/payments - List payments
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isAdmin = req.user!.role === 'admin';
    const { status, search, startDate, endDate, userId } = req.query;

    let sql = `
      SELECT p.*,
             u.name as user_name, u.email as user_email,
             pl.plan_name, pl.billing_cycle,
             s.start_date, s.end_date, s.status as subscription_status
      FROM payments p
      JOIN users u ON p.user_id = u.user_id
      JOIN subscriptions s ON p.subscription_id = s.subscription_id
      JOIN plans pl ON s.plan_id = pl.plan_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!isAdmin) {
      sql += ` AND p.user_id = ?`;
      params.push(req.user!.user_id);
    } else if (userId) {
      sql += ` AND p.user_id = ?`;
      params.push(userId);
    }

    if (status && status !== 'all') {
      sql += ` AND p.payment_status = ?`;
      params.push(status);
    }

    if (startDate) {
      sql += ` AND date(p.payment_date) >= date(?)`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND date(p.payment_date) <= date(?)`;
      params.push(endDate);
    }

    if (search) {
      sql += ` AND (p.transaction_id LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR pl.plan_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY p.payment_date DESC`;

    const payments = await query<any>(sql, params);

    // Calculate summary statistics
    const totalAmount = payments
      .filter((p) => p.payment_status === 'successful')
      .reduce((acc, p) => acc + Number(p.amount), 0);

    return res.json({
      payments,
      summary: {
        totalCount: payments.length,
        successfulCount: payments.filter((p) => p.payment_status === 'successful').length,
        totalAmount,
      },
    });
  } catch (error: any) {
    console.error('Fetch payments error:', error);
    return res.status(500).json({ error: 'Failed to retrieve payment records.' });
  }
});

// GET /api/payments/:id/receipt - Fetch detailed invoice receipt
router.get('/:id/receipt', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const paymentId = req.params.id;
    const isAdmin = req.user!.role === 'admin';

    const payment = await queryOne<any>(
      `SELECT p.*,
              u.name as user_name, u.email as user_email, u.phone as user_phone,
              pl.plan_name, pl.description as plan_description, pl.billing_cycle, pl.features,
              s.start_date, s.end_date, s.status as subscription_status
       FROM payments p
       JOIN users u ON p.user_id = u.user_id
       JOIN subscriptions s ON p.subscription_id = s.subscription_id
       JOIN plans pl ON s.plan_id = pl.plan_id
       WHERE p.payment_id = ? OR p.transaction_id = ?`,
      [paymentId, paymentId]
    );

    if (!payment) {
      return res.status(404).json({ error: 'Receipt not found.' });
    }

    if (!isAdmin && payment.user_id !== req.user!.user_id) {
      return res.status(403).json({ error: 'Unauthorized to view this receipt.' });
    }

    // Parse features if available
    let parsedFeatures: string[] = [];
    try {
      parsedFeatures = typeof payment.features === 'string' ? JSON.parse(payment.features) : payment.features;
    } catch {
      parsedFeatures = [];
    }

    const subtotal = Number(payment.amount);
    const taxRate = 0.18; // 18% GST standard for software in India
    const baseAmount = +(subtotal / (1 + taxRate)).toFixed(2);
    const gstAmount = +(subtotal - baseAmount).toFixed(2);

    return res.json({
      receipt: {
        ...payment,
        features: parsedFeatures,
        baseAmount,
        gstAmount,
        currency: '₹',
        issuedBy: 'Subscribo Platform Technologies Ltd.',
        address: 'Tech Innovation Park, Sector 5, Bengaluru, Karnataka, India',
        gstNumber: '29AAECS1234F1Z8',
      },
    });
  } catch (error: any) {
    console.error('Fetch receipt error:', error);
    return res.status(500).json({ error: 'Failed to generate receipt.' });
  }
});

export default router;
