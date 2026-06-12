import { Router } from 'express';
import { sourcesService } from './sources.service.js';

export const sourcesRouter = Router();

sourcesRouter.get('/', (_req, res) => {
  res.json({ sources: sourcesService.listActive() });
});
