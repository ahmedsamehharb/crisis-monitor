import { Router } from 'express';
import { eventsService } from './events.service.js';

export const eventsRouter = Router();

eventsRouter.get('/', async (_req, res) => {
  const reports = await eventsService.listRecent();
  res.json({ count: reports.length, reports });
});
