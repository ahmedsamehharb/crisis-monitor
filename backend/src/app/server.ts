import { config } from './config/index.js';
import { createApp } from './app.js';
import { ingestionService } from '../modules/ingestion/ingestion.service.js';
import { logger } from '../shared/logger/logger.js';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info('Server', `Listening on http://localhost:${config.port}`);

  if (config.ingestion.enabled) {
    ingestionService.registerDefaults();
    ingestionService.start();
  }
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(
      'Server',
      `Port ${config.port} is already in use. Stop the other process (Ctrl+C) or free the port.`
    );
    process.exit(1);
  }
  throw err;
});

function shutdown() {
  ingestionService.stop();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
