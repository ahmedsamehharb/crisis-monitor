import { IngestedReport } from '../../../../src/shared/types/index';
import mobidataClient from './mobidata.client';
import mobidataMapper from './mobidata.mapper';

interface ReportHandler {
    (report: IngestedReport): void;
}

class MobidataAdapter {
    private reportHandler: ReportHandler | null = null;
    private intervalId: NodeJS.Timeout | null = null;

    start(reportHandler: ReportHandler) {
        this.reportHandler = reportHandler;
        this.intervalId = setInterval(async () => {
            if (!process.env.MOBIDATA_API_URL) {
                throw new Error('MOBIDATA_API_URL environment variable is not set');
            }
            const rawData = await mobidataClient();
            const mappedData: IngestedReport = {
                id: '',
                source: 'mobidata',
                sourceId: '',
                rawText: '',
                category: 'traffic',
                trustLevel: 0.9,
                lat: rawData.lat,
                lon: rawData.lon,
                eventType: rawData.incidentType === 'road_closed' ? 'road_closed' : 'traffic_jam',
            };
            if (this.reportHandler) {
                this.reportHandler(mappedData);
            }
        }, 5 * 60 * 1000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}

export default MobidataAdapter;
