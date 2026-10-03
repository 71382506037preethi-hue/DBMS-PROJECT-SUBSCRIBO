import { Router, Request, Response } from 'express';
import { getDb, resetDatabaseToDefault } from '../db.ts';
import { authenticate, requireAdmin } from '../middleware/auth.ts';

const router = Router();

// Protect ALL backend database inspector endpoints: Admin privileges required
router.use(authenticate, requireAdmin);

// Curated demo queries matching DBMS viva PBL syllabus
const DEMO_QUERIES = [
  {
    id: 'inner-join',
    title: '1. INNER JOIN (Subscriptions, Users & Plans)',
    concept: 'Demonstrates multi-table INNER JOIN matching foreign keys',
    sql: `SELECT s.subscription_id, 
       u.name AS customer_name, 
       u.email AS customer_email, 
       p.plan_name, 
       p.price, 
       s.start_date, 
       s.end_date, 
       s.status
FROM subscriptions s
INNER JOIN users u ON s.user_id = u.user_id
INNER JOIN plans p ON s.plan_id = p.plan_id
ORDER BY s.subscription_id ASC;`,
  },
  {
    id: 'left-join',
    title: '2. LEFT JOIN (All Users & Subscription Status)',
    concept: 'Demonstrates LEFT OUTER JOIN finding customers who may not have an active subscription',
    sql: `SELECT u.user_id, 
       u.name, 
       u.email, 
       u.role,
       COALESCE(p.plan_name, 'No Plan') AS subscribed_plan,
       COALESCE(s.status, 'none') AS subscription_status
FROM users u
LEFT JOIN subscriptions s ON u.user_id = s.user_id
LEFT JOIN plans p ON s.plan_id = p.plan_id
WHERE u.role = 'customer'
ORDER BY u.user_id ASC;`,
  },
  {
    id: 'group-by-count',
    title: '3. GROUP BY & COUNT() (Subscribers Per Plan)',
    concept: 'Demonstrates GROUP BY with COUNT() aggregate function',
    sql: `SELECT p.plan_id, 
       p.plan_name, 
       p.price, 
       p.billing_cycle,
       COUNT(s.subscription_id) AS total_subscribers,
       SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) AS active_subscribers
FROM plans p
LEFT JOIN subscriptions s ON p.plan_id = s.plan_id
GROUP BY p.plan_id, p.plan_name, p.price, p.billing_cycle
ORDER BY total_subscribers DESC;`,
  },
  {
    id: 'group-by-sum-having',
    title: '4. GROUP BY, SUM() & HAVING (Revenue by Payment Method)',
    concept: 'Demonstrates aggregate filtering using the HAVING clause',
    sql: `SELECT payment_method, 
       COUNT(payment_id) AS transaction_count, 
       SUM(amount) AS total_revenue,
       ROUND(AVG(amount), 2) AS average_ticket_size
FROM payments
WHERE payment_status = 'successful'
GROUP BY payment_method
HAVING SUM(amount) > 500
ORDER BY total_revenue DESC;`,
  },
  {
    id: 'avg-order-by',
    title: '5. AVG() & ORDER BY (Average Subscription Spend)',
    concept: 'Demonstrates AVG() calculation with descending order',
    sql: `SELECT u.user_id, 
       u.name, 
       COUNT(pm.payment_id) AS payments_count,
       ROUND(AVG(pm.amount), 2) AS average_payment,
       SUM(pm.amount) AS total_spent
FROM users u
JOIN payments pm ON u.user_id = pm.user_id
WHERE pm.payment_status = 'successful'
GROUP BY u.user_id, u.name
ORDER BY total_spent DESC;`,
  },
  {
    id: 'subquery',
    title: '6. SUBQUERY (Payments Above Overall Average)',
    concept: 'Demonstrates Nested Subquery comparing against an aggregate sub-select',
    sql: `SELECT p.transaction_id, 
       u.name AS customer_name, 
       pl.plan_name, 
       p.amount, 
       p.payment_method, 
       p.payment_date
FROM payments p
JOIN users u ON p.user_id = u.user_id
JOIN subscriptions s ON p.subscription_id = s.subscription_id
JOIN plans pl ON s.plan_id = pl.plan_id
WHERE p.amount > (
    SELECT AVG(amount) FROM payments WHERE payment_status = 'successful'
)
ORDER BY p.amount DESC;`,
  },
  {
    id: 'history-audit',
    title: '7. AUDIT TRAIL JOIN (Subscription Lifecycle Changes)',
    concept: 'Demonstrates self/parent table join tracking subscription history transitions',
    sql: `SELECT sh.history_id,
       s.subscription_id,
       u.name AS user_name,
       sh.action,
       COALESCE(old_p.plan_name, 'None') AS previous_plan,
       COALESCE(new_p.plan_name, 'None') AS updated_plan,
       sh.notes,
       sh.action_date
FROM subscription_history sh
JOIN subscriptions s ON sh.subscription_id = s.subscription_id
JOIN users u ON s.user_id = u.user_id
LEFT JOIN plans old_p ON sh.old_plan_id = old_p.plan_id
LEFT JOIN plans new_p ON sh.new_plan_id = new_p.plan_id
ORDER BY sh.action_date DESC;`,
  },
];

// GET /api/db/demo-queries
router.get('/demo-queries', (_req: Request, res: Response) => {
  return res.json({ queries: DEMO_QUERIES });
});

// POST /api/db/query - Execute custom or demo SQL query
router.post('/query', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL query statement is required.' });
    }

    const trimmed = sql.trim();
    // Block destructive table dropping in query runner
    const disallowed = ['drop table', 'drop database', 'alter table', 'attach', 'detach'];
    if (disallowed.some((keyword) => trimmed.toLowerCase().includes(keyword))) {
      return res.status(400).json({
        error: 'DDL DROP/ALTER statements are restricted in this query console for safety.',
      });
    }

    const db = await getDb();
    const results = db.exec(trimmed);
    const executionTimeMs = Date.now() - startTime;

    if (!results || results.length === 0) {
      return res.json({
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs,
        message: 'Query executed successfully with 0 rows returned.',
      });
    }

    const firstResult = results[0];
    const columns = firstResult.columns;
    const rows = firstResult.values.map((row) => {
      const obj: Record<string, any> = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    return res.json({
      columns,
      rows,
      rowCount: rows.length,
      executionTimeMs,
    });
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    return res.status(400).json({
      error: error.message || 'SQL Execution Error',
      executionTimeMs,
    });
  }
});

// GET /api/db/tables-data - Fetches live rows, schema, and record count for all database tables
router.get('/tables-data', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const tableNames = ['users', 'subscriptions', 'plans', 'payments', 'subscription_history', 'system_settings'];
    const tables: Record<string, {
      name: string;
      rowCount: number;
      columns: { name: string; type: string; pk: boolean; notnull: boolean }[];
      rows: Record<string, any>[];
      pkColumn: string;
    }> = {};

    for (const table of tableNames) {
      const colInfo = db.exec(`PRAGMA table_info(${table});`);
      const columns = colInfo[0]
        ? colInfo[0].values.map((v) => ({
            name: v[1] as string,
            type: v[2] as string,
            notnull: v[3] === 1,
            pk: v[5] === 1,
          }))
        : [];

      const pkCol = columns.find((c) => c.pk)?.name || 'rowid';
      let querySql = `SELECT * FROM ${table} ORDER BY ${pkCol} DESC;`;

      if (table === 'users') {
        // Enhance users with live subscription and plan relational details
        querySql = `
          SELECT 
            u.user_id,
            u.name,
            u.email,
            u.phone,
            u.role,
            u.status,
            p.plan_name AS subscribed_plan,
            s.status AS subscription_status,
            p.price AS plan_price,
            s.start_date AS subscription_start,
            s.end_date AS subscription_end,
            s.subscription_id AS active_subscription_id,
            u.password_hash,
            u.created_at
          FROM users u
          LEFT JOIN subscriptions s ON s.subscription_id = (
            SELECT sub.subscription_id 
            FROM subscriptions sub 
            WHERE sub.user_id = u.user_id 
            ORDER BY 
              CASE 
                WHEN sub.status = 'active' THEN 1 
                WHEN sub.status = 'expiring_soon' THEN 2 
                ELSE 3 
              END, 
              sub.subscription_id DESC 
            LIMIT 1
          )
          LEFT JOIN plans p ON s.plan_id = p.plan_id
          ORDER BY u.user_id DESC;
        `;

        // Add virtual relational columns beside user details
        const statusIdx = columns.findIndex((c) => c.name === 'status');
        const insertIdx = statusIdx !== -1 ? statusIdx + 1 : columns.length;
        columns.splice(
          insertIdx,
          0,
          { name: 'subscribed_plan', type: 'RELATIONAL (plans.plan_name)', pk: false, notnull: false },
          { name: 'subscription_status', type: 'RELATIONAL (subscriptions.status)', pk: false, notnull: false },
          { name: 'plan_price', type: 'RELATIONAL (plans.price)', pk: false, notnull: false },
          { name: 'subscription_end', type: 'RELATIONAL (subscriptions.end_date)', pk: false, notnull: false },
          { name: 'active_subscription_id', type: 'RELATIONAL (subscriptions.subscription_id)', pk: false, notnull: false }
        );
      }

      const queryRes = db.exec(querySql);

      let rows: Record<string, any>[] = [];
      if (queryRes && queryRes.length > 0) {
        const cols = queryRes[0].columns;
        rows = queryRes[0].values.map((valRow) => {
          const obj: Record<string, any> = {};
          cols.forEach((col, idx) => {
            obj[col] = valRow[idx];
          });
          return obj;
        });
      }

      tables[table] = {
        name: table,
        rowCount: rows.length,
        columns,
        rows,
        pkColumn: pkCol,
      };
    }

    return res.json({
      tables,
      fetchedAt: new Date().toISOString(),
      engine: 'SQLite3 In-Memory Relational Engine with ACID Transactions',
    });
  } catch (error: any) {
    console.error('Fetch tables data error:', error);
    return res.status(500).json({ error: 'Failed to retrieve database tables data.' });
  }
});

// GET /api/db/schema-info - Returns ER diagram tables and foreign key relationships
router.get('/schema-info', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();

    const tables = ['users', 'plans', 'subscriptions', 'payments', 'subscription_history', 'system_settings'];
    const schemaDetails: Record<string, any> = {};

    for (const table of tables) {
      const colInfo = db.exec(`PRAGMA table_info(${table});`);
      const fkInfo = db.exec(`PRAGMA foreign_key_list(${table});`);

      const columns = colInfo[0]
        ? colInfo[0].values.map((v) => ({
            cid: v[0],
            name: v[1],
            type: v[2],
            notnull: v[3] === 1,
            dflt_value: v[4],
            pk: v[5] === 1,
          }))
        : [];

      const foreignKeys = fkInfo[0]
        ? fkInfo[0].values.map((v) => ({
            id: v[0],
            seq: v[1],
            table: v[2],
            from: v[3],
            to: v[4],
            on_update: v[5],
            on_delete: v[6],
          }))
        : [];

      schemaDetails[table] = { columns, foreignKeys };
    }

    return res.json({
      schema: schemaDetails,
      relationships: [
        { fromTable: 'subscriptions', fromCol: 'user_id', toTable: 'users', toCol: 'user_id', type: 'Many-to-One (N:1)' },
        { fromTable: 'subscriptions', fromCol: 'plan_id', toTable: 'plans', toCol: 'plan_id', type: 'Many-to-One (N:1)' },
        { fromTable: 'payments', fromCol: 'subscription_id', toTable: 'subscriptions', toCol: 'subscription_id', type: 'Many-to-One (N:1)' },
        { fromTable: 'payments', fromCol: 'user_id', toTable: 'users', toCol: 'user_id', type: 'Many-to-One (N:1)' },
        { fromTable: 'subscription_history', fromCol: 'subscription_id', toTable: 'subscriptions', toCol: 'subscription_id', type: 'Many-to-One (N:1)' },
        { fromTable: 'subscription_history', fromCol: 'new_plan_id', toTable: 'plans', toCol: 'plan_id', type: 'Optional (N:1)' },
      ],
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve schema metadata.' });
  }
});

// POST /api/db/reset - Reset database to factory seed
router.post('/reset', async (_req: Request, res: Response) => {
  try {
    await resetDatabaseToDefault();
    return res.json({ message: 'Database reset successfully to initial sample data.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to reset database.' });
  }
});

export default router;
