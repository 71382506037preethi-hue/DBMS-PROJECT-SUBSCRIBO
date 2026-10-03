import { Router, Response } from 'express';
import { query, queryOne, refreshSubscriptionStatuses } from '../db.ts';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/reports/dashboard - Complete analytics payload for admin
router.get('/dashboard', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await refreshSubscriptionStatuses();
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const dateParams: any[] = [];
    if (startDate) {
      dateFilter += ` AND date(payment_date) >= date(?)`;
      dateParams.push(startDate);
    }
    if (endDate) {
      dateFilter += ` AND date(payment_date) <= date(?)`;
      dateParams.push(endDate);
    }

    // 1. Overall Key Metric Counters
    const usersCount = await queryOne<any>('SELECT COUNT(*) as total_users, SUM(CASE WHEN role != "admin" THEN 1 ELSE 0 END) as customers FROM users');
    
    const subStats = await queryOne<any>(`
      SELECT 
        COUNT(*) as total_subs,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_subs,
        SUM(CASE WHEN status = 'expiring_soon' THEN 1 ELSE 0 END) as expiring_soon_subs,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_subs,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_subs,
        SUM(CASE WHEN auto_renew = 1 THEN 1 ELSE 0 END) as auto_renew_count
      FROM subscriptions
    `);

    const revenueStats = await queryOne<any>(`
      SELECT 
        SUM(CASE WHEN payment_status = 'successful' THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN payment_status = 'successful' AND payment_date >= date('now', 'start of month') THEN amount ELSE 0 END) as monthly_revenue,
        COUNT(*) as total_transactions,
        SUM(CASE WHEN payment_status = 'successful' THEN 1 ELSE 0 END) as successful_txns
      FROM payments
      WHERE 1=1 ${dateFilter}
    `, dateParams);

    const renewalStats = await queryOne<any>(`
      SELECT COUNT(*) as total_renewals 
      FROM subscription_history 
      WHERE action = 'Renewed'
    `);

    // 2. Revenue by Plan (GROUP BY & SUM)
    const revenueByPlan = await query<any>(`
      SELECT p.plan_id, p.plan_name, p.billing_cycle, p.price,
             COUNT(DISTINCT s.subscription_id) as total_subscriptions,
             COUNT(pm.payment_id) as payment_count,
             COALESCE(SUM(pm.amount), 0) as total_revenue,
             COALESCE(SUM(pm.amount), 0) as plan_revenue
      FROM plans p
      LEFT JOIN subscriptions s ON p.plan_id = s.plan_id
      LEFT JOIN payments pm ON s.subscription_id = pm.subscription_id AND pm.payment_status = 'successful'
      GROUP BY p.plan_id
      ORDER BY total_revenue DESC
    `);

    // 3. Subscription Status Distribution (for charts)
    const statusDistribution = [
      { status: 'Active', count: subStats.active_subs || 0, color: '#10B981' },
      { status: 'Expiring Soon', count: subStats.expiring_soon_subs || 0, color: '#F59E0B' },
      { status: 'Expired', count: subStats.expired_subs || 0, color: '#6B7280' },
      { status: 'Cancelled', count: subStats.cancelled_subs || 0, color: '#EF4444' },
    ];

    // 4. Monthly Revenue Trend (Last 6 Months using SQLite strftime)
    const monthlyTrends = await query<any>(`
      SELECT strftime('%Y-%m', payment_date) as month,
             SUM(amount) as revenue,
             COUNT(*) as payment_count
      FROM payments
      WHERE payment_status = 'successful'
      GROUP BY strftime('%Y-%m', payment_date)
      ORDER BY month ASC
      LIMIT 6
    `);

    // 5. Payment Methods Distribution (GROUP BY payment_method)
    const paymentMethods = await query<any>(`
      SELECT payment_method, 
             COUNT(*) as transaction_count,
             SUM(amount) as total_amount
      FROM payments
      WHERE payment_status = 'successful'
      GROUP BY payment_method
    `);

    // 6. Plan Popularity (Most and Least Popular)
    const planPopularity = await query<any>(`
      SELECT p.plan_id, p.plan_name, p.price, p.billing_cycle,
             COUNT(s.subscription_id) as subscriber_count,
             COUNT(s.subscription_id) as subscribers,
             SUM(CASE WHEN s.status IN ('active', 'expiring_soon') THEN 1 ELSE 0 END) as active_count,
             ROUND(COUNT(s.subscription_id) * 100.0 / (SELECT MAX(1, COUNT(*)) FROM subscriptions), 1) as market_share
      FROM plans p
      LEFT JOIN subscriptions s ON p.plan_id = s.plan_id
      GROUP BY p.plan_id
      ORDER BY subscriber_count DESC
    `);

    // 7. Recent Activities (from subscription_history joined with users)
    const recentActivities = await query<any>(`
      SELECT sh.history_id, sh.action, sh.notes, sh.action_date,
             u.name as user_name, u.email as user_email,
             p.plan_name
      FROM subscription_history sh
      JOIN subscriptions s ON sh.subscription_id = s.subscription_id
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN plans p ON s.plan_id = p.plan_id
      ORDER BY sh.action_date DESC
      LIMIT 8
    `);

    // 8. Customer Segments (Array formatted for UI cards)
    const activeSeg = await queryOne<any>(`
      SELECT COUNT(DISTINCT u.user_id) as user_count,
             COALESCE(AVG(p_sum.total_spent), 0) as avg_spent
      FROM users u
      JOIN subscriptions s ON u.user_id = s.user_id AND s.status IN ('active', 'expiring_soon')
      LEFT JOIN (
        SELECT user_id, SUM(amount) as total_spent
        FROM payments WHERE payment_status = 'successful'
        GROUP BY user_id
      ) p_sum ON u.user_id = p_sum.user_id
      WHERE u.role != 'admin'
    `);

    const expiredSeg = await queryOne<any>(`
      SELECT COUNT(DISTINCT u.user_id) as user_count,
             COALESCE(AVG(p_sum.total_spent), 0) as avg_spent
      FROM users u
      JOIN subscriptions s ON u.user_id = s.user_id AND s.status = 'expired'
      LEFT JOIN (
        SELECT user_id, SUM(amount) as total_spent
        FROM payments WHERE payment_status = 'successful'
        GROUP BY user_id
      ) p_sum ON u.user_id = p_sum.user_id
      WHERE u.role != 'admin'
      AND u.user_id NOT IN (
        SELECT user_id FROM subscriptions WHERE status IN ('active', 'expiring_soon')
      )
    `);

    const newSeg = await queryOne<any>(`
      SELECT COUNT(DISTINCT u.user_id) as user_count
      FROM users u
      LEFT JOIN subscriptions s ON u.user_id = s.user_id
      WHERE u.role != 'admin' AND s.subscription_id IS NULL
    `);

    const customerSegments = [
      {
        segment: 'Active Subscribers',
        user_count: Number(activeSeg?.user_count || 0),
        avg_spent: Math.round(Number(activeSeg?.avg_spent || 0)),
      },
      {
        segment: 'Expired / Lapsed Customers',
        user_count: Number(expiredSeg?.user_count || 0),
        avg_spent: Math.round(Number(expiredSeg?.avg_spent || 0)),
      },
      {
        segment: 'Registered (No Active Plan)',
        user_count: Number(newSeg?.user_count || 0),
        avg_spent: 0,
      },
    ];

    return res.json({
      metrics: {
        totalUsers: usersCount.total_users || 0,
        totalCustomers: usersCount.customers || 0,
        activeSubscriptions: subStats.active_subs || 0,
        expiringSoonSubscriptions: subStats.expiring_soon_subs || 0,
        expiredSubscriptions: subStats.expired_subs || 0,
        cancelledSubscriptions: subStats.cancelled_subs || 0,
        totalRevenue: revenueStats.total_revenue || 0,
        monthlyRevenue: revenueStats.monthly_revenue || 0,
        totalTransactions: revenueStats.total_transactions || 0,
        totalRenewals: renewalStats.total_renewals || 0,
        autoRenewRate: subStats.total_subs ? Math.round((subStats.auto_renew_count / subStats.total_subs) * 100) : 0,
      },
      revenueByPlan,
      statusDistribution,
      monthlyTrends,
      paymentMethods,
      planPopularity,
      recentActivities,
      customerSegments,
    });
  } catch (error: any) {
    console.error('Reports dashboard error:', error);
    return res.status(500).json({ error: 'Failed to generate reports dashboard.' });
  }
});

export default router;
