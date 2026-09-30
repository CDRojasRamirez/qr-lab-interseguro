import { pino, type Logger } from 'pino';

/** Creates the structured JSON logger. */
export function createLogger(level: string): Logger {
  return pino({ level });
}
