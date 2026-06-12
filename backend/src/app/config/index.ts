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
} as const;
