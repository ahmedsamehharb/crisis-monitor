import { Router } from 'express';
import { isDatabaseEnabled } from '../../shared/database/prisma.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'crisis-monitor-backend',
    database: isDatabaseEnabled() ? 'configured' : 'memory-only',
  });
});
