import express from 'express';
import cors from 'cors';
import { healthRouter } from '../modules/health/health.controller.js';
import { eventsRouter } from '../modules/events/events.controller.js';
import { sourcesRouter } from '../modules/sources/sources.controller.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/sources', sourcesRouter);

  return app;
}
