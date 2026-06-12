import { Router } from 'express';
import { eventsService } from './events.service.js';

export const eventsRouter = Router();

/** List clustered crisis events (aggregated view for dashboard) */
eventsRouter.get('/', async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const events = await eventsService.listEvents(limit);
  res.json({ count: events.length, events });
});

/** Single crisis event with all member signals for verification */
eventsRouter.get('/:id', async (req, res) => {
  const detail = await eventsService.getEventDetail(req.params.id);
  if (!detail) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json(detail);
});

export const reportsRouter = Router();

/** Flat list of raw ingested reports (debug / legacy) */
reportsRouter.get('/', async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const reports = await eventsService.listRecentReports(limit);
  res.json({ count: reports.length, reports });
});
