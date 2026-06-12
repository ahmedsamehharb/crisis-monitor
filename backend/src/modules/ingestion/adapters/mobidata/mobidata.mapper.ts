import type { IngestedReport } from '../../../normalization/report.types.js';
import type { DataSourceId } from '../../../../shared/types/index.js';
import type { MobidataResponse } from './mobidata.types.js';

const mobidataMapper = (rawData: MobidataResponse): IngestedReport => {
    return {
        id: `mobidata:${rawData.id}`,
        source: 'mobidata' as DataSourceId,
        sourceId: rawData.id || 'unknown',
        rawText: rawData.description || 'Traffic incident',
        url: rawData.sourceUrl || '',
        author: 'MobiData BW',
        createdAt: new Date().toISOString(),
        ingestedAt: new Date().toISOString(),
        keywords: ['traffic'],
        
        // Hepsini tek bir türe eşitledik
        eventType: 'traffic_accident', 
        
        mediaUrls: [],
        trust: 0.9,
        severity: 0.5,
        location: {
            lat: rawData.lat,
            lon: rawData.lon,
            municipality: rawData.areaDesc || undefined
        },
        metadata: {
            latitude: rawData.lat,
            longitude: rawData.lon,
            locationLabel: rawData.areaDesc || undefined,
            trust: 0.9,
            severity: 0.5,
            crisisEventId: null
        }
    };
};

export default mobidataMapper;