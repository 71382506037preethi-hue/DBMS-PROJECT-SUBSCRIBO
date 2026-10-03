import { Router, Response } from 'express';
import { query, queryOne, run, refreshSubscriptionStatuses } from '../db.ts';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/settings
router.get('/', async (_req, res: Response) => {
  try {
    const settings = await query<any>('SELECT * FROM system_settings');
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.setting_key] = s.setting_value;
    });
    return res.json({ settings: settingsMap, raw: settings });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// POST /api/settings - Update settings (Admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { expiring_soon_days } = req.body;

    if (expiring_soon_days !== undefined) {
      const days = Number(expiring_soon_days);
      if (isNaN(days) || days < 1 || days > 60) {
        return res.status(400).json({ error: 'Expiring soon threshold must be between 1 and 60 days.' });
      }

      await run(
        `INSERT INTO system_settings (setting_key, setting_value, description)
         VALUES ('expiring_soon_days', ?, 'Threshold in days to flag subscriptions as expiring soon')
         ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
        [days.toString()]
      );

      // Re-trigger automatic status re-calculation with the newly configured days!
      await refreshSubscriptionStatuses(days);
    }

    const updated = await queryOne('SELECT setting_value FROM system_settings WHERE setting_key = "expiring_soon_days"');
    return res.json({
      message: `System settings updated. Subscriptions within ${updated?.setting_value} days of expiry are now marked 'Expiring Soon'.`,
      expiring_soon_days: updated?.setting_value,
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: 'Failed to update system settings.' });
  }
});

export default router;
