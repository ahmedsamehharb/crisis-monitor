type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, tag: string, message: string, meta?: unknown) {
  const prefix = `[${tag}]`;
  const fn =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : console.log;

  if (meta !== undefined) {
    fn(prefix, message, meta);
  } else {
    fn(prefix, message);
  }
}

export const logger = {
  info: (tag: string, message: string, meta?: unknown) =>
    log('info', tag, message, meta),
  warn: (tag: string, message: string, meta?: unknown) =>
    log('warn', tag, message, meta),
  error: (tag: string, message: string, meta?: unknown) =>
    log('error', tag, message, meta),
  debug: (tag: string, message: string, meta?: unknown) =>
    log('debug', tag, message, meta),
};

export function logCrisisMatch({
  source,
  keywords,
  author,
  text,
  url,
  createdAt,
}: {
  source: string;
  keywords: string[];
  author: string;
  text: string;
  url: string;
  createdAt: string;
}) {
  console.log(`\n--- Crisis post detected [${source}] ---`);
  console.log('Keywords:', keywords.join(', '));
  console.log('Author:', author);
  console.log('Text:', text);
  console.log('URL:', url);
  console.log('Created:', createdAt);
  console.log('------------------------------------\n');
}
