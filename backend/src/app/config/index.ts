import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',

  mastodon: {
    enabled: process.env.MASTODON_ENABLED !== 'false',
    instance: process.env.MASTODON_INSTANCE || 'mastodon.social',
    stream: process.env.MASTODON_STREAM || 'public',
    accessToken: process.env.MASTODON_ACCESS_TOKEN || '',
    mode: (process.env.MASTODON_MODE || 'search') as 'search' | 'timeline' | 'stream',
    pollLocal: process.env.MASTODON_POLL_LOCAL === 'true',
    pollIntervalMs: Number(process.env.MASTODON_POLL_INTERVAL_MS) || 15000,
  },

  bluesky: {
    enabled: process.env.BLUESKY_ENABLED !== 'false',
    apiBase: process.env.BLUESKY_API_BASE || 'https://api.bsky.app',
    pollIntervalMs: Number(process.env.BLUESKY_POLL_INTERVAL_MS) || 15000,
  },

  ingestion: {
    enabled: process.env.INGESTION_ENABLED !== 'false',
  },

  dwd: {
    enabled: process.env.DWD_ENABLED !== 'false',
    pollIntervalMs: Number(process.env.DWD_POLL_INTERVAL_MS) || 600_000,
    bwOnly: process.env.DWD_BW_ONLY !== 'false',
    source: (process.env.DWD_SOURCE || 'auto') as 'auto' | 'json' | 'cap',
    jsonUrl:
      process.env.DWD_JSON_URL ||
      'https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json',
    capDiffUrl:
      process.env.DWD_CAP_DIFF_URL ||
      'https://opendata.dwd.de/weather/alerts/cap/DISTRICT_EVENT_DIFF/',
  },

  pegelonline: {
    enabled: process.env.PEGELONLINE_ENABLED !== 'false',
    apiBase:
      process.env.PEGELONLINE_API_BASE ||
      'https://www.pegelonline.wsv.de/webservices/rest-api/v2',
    pollIntervalMs: Number(process.env.PEGELONLINE_POLL_INTERVAL_MS) || 300000,
    /** Rivers relevant to Baden-Württemberg flood monitoring */
    waters: (
      process.env.PEGELONLINE_WATERS ||
      'NECKAR,RHEIN,DONAU,MAIN,KOCHER,ENZ,MURG,KINZIG,ILLER,TAUBER'
    )
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean),
    /** Alert when level reaches this fraction of the next flood mark (0–1) */
    warningRatio: Number(process.env.PEGELONLINE_WARNING_RATIO) || 0.9,
  },
} as const;
