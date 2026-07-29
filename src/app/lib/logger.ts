/**
 * Enterprise Structured Logger
 * Provides level-based logging (info, warn, error, debug) with timing and production sanitization.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: string;
  durationMs?: number;
  data?: Record<string, unknown>;
  timestamp: string;
}

export class Logger {
  private static isProduction = process.env.NODE_ENV === 'production';

  private static formatLog(payload: LogPayload): string {
    const contextStr = payload.context ? `[${payload.context}]` : '';
    const durationStr = payload.durationMs !== undefined ? ` (${payload.durationMs}ms)` : '';
    return `${payload.timestamp} ${payload.level.toUpperCase()} ${contextStr} ${payload.message}${durationStr}`;
  }

  static info(message: string, context?: string, data?: Record<string, unknown>): void {
    const payload: LogPayload = {
      level: 'info',
      message,
      context,
      data,
      timestamp: new Date().toISOString()
    };
    console.log(this.formatLog(payload), data || '');
  }

  static warn(message: string, context?: string, durationMs?: number): void {
    const payload: LogPayload = {
      level: 'warn',
      message,
      context,
      durationMs,
      timestamp: new Date().toISOString()
    };
    console.warn(this.formatLog(payload));
  }

  static error(message: string, error?: unknown, context?: string): void {
    const payload: LogPayload = {
      level: 'error',
      message,
      context,
      timestamp: new Date().toISOString()
    };
    console.error(this.formatLog(payload), error || '');
  }

  static debug(message: string, context?: string, data?: Record<string, unknown>): void {
    if (this.isProduction) return; // Omit verbose debug in production
    const payload: LogPayload = {
      level: 'debug',
      message,
      context,
      data,
      timestamp: new Date().toISOString()
    };
    console.debug(this.formatLog(payload), data || '');
  }
}

export const logger = Logger;
