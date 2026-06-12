import { ingestionService } from '../ingestion/ingestion.service.js';

export class SourcesService {
  listActive() {
    return ingestionService.listSources();
  }
}

export const sourcesService = new SourcesService();
