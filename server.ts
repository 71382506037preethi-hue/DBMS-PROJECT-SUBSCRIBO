import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { getDb } from './server/db.ts';

import authRouter from './server/routes/auth.ts';
import usersRouter from './server/routes/users.ts';
import plansRouter from './server/routes/plans.ts';
import subscriptionsRouter from './server/routes/subscriptions.ts';
import paymentsRouter from './server/routes/payments.ts';
import reportsRouter from './server/routes/reports.ts';
import dbConsoleRouter from './server/routes/db-console.ts';
import settingsRouter from './server/routes/settings.ts';

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Initialize DB and ensure schema & seed
  console.log('Bootstrapping SUBSCRIBO Relational Database...');
  await getDb();
  console.log('SUBSCRIBO Database ready.');

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      application: 'SUBSCRIBO - Subscription Management System',
      environment: process.env.NODE_ENV || 'development',
      time: new Date().toISOString(),
    });
  });

  // REST API Endpoints
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/plans', plansRouter);
  app.use('/api/subscriptions', subscriptionsRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/db', dbConsoleRouter);
  app.use('/api/settings', settingsRouter);

  // Vite middleware for development / Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SUBSCRIBO Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
