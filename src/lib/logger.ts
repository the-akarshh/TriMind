/**
 * ==============================================================================
 * APTITUDE ARENA — STRUCTURED OBSERVABILITY LOGGER
 * Production-ready JSON & leveled logger with security audit tracking
 * ==============================================================================
 */

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "SECURITY";

export interface LogContext {
  correlationId?: string;
  roomCode?: string;
  userId?: string;
  socketId?: string;
  action?: string;
  [key: string]: unknown;
}

class ArenaLogger {
  private isProduction = process.env.NODE_ENV === "production";
  private isTest = process.env.NODE_ENV === "test";

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      message,
      ...(context || {}),
    };

    if (this.isProduction) {
      return JSON.stringify(payload);
    }

    // Human-readable formatted output for development
    const ctxString = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.padEnd(8)}] ${message}${ctxString}`;
  }

  public debug(message: string, context?: LogContext): void {
    if (this.isTest && !process.env.DEBUG) return;
    console.debug(this.formatMessage("DEBUG", message, context));
  }

  public info(message: string, context?: LogContext): void {
    if (this.isTest && !process.env.DEBUG) return;
    console.log(this.formatMessage("INFO", message, context));
  }

  public warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage("WARN", message, context));
  }

  public error(message: string, error?: unknown, context?: LogContext): void {
    const errDetails =
      error instanceof Error
        ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
        : { rawError: String(error) };

    console.error(this.formatMessage("ERROR", message, { ...context, ...errDetails }));
  }

  /**
   * Dedicated Security & Anti-Cheat Audit Trail
   */
  public security(event: string, violation: {
    actorId?: string;
    socketId?: string;
    roomCode?: string;
    reason: string;
    payload?: unknown;
  }): void {
    const context: LogContext = {
      action: `SECURITY_VIOLATION:${event}`,
      actorId: violation.actorId,
      socketId: violation.socketId,
      roomCode: violation.roomCode,
      reason: violation.reason,
      payload: violation.payload,
    };

    console.warn(this.formatMessage("SECURITY", `🚨 Anti-Cheat Alert: ${violation.reason}`, context));
  }
}

export const logger = new ArenaLogger();
