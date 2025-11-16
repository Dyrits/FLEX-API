import type ILogger from "./logger.interface";

export default class ConsoleLogger implements ILogger {
  constructor(public context: Record<string, unknown> = {}) {}

  debug(message: string, metadata: Record<string, unknown> = {}): void {
    console.debug(message, { ...metadata, context: this.context, severity: "DEBUG", timestamp: new Date().toISOString() });
  }

  info(message: string, metadata: Record<string, unknown> = {}): void {
    console.info(message, { ...metadata, context: this.context, severity: "INFO", timestamp: new Date().toISOString() });
  }

  warn(message: string, metadata: Record<string, unknown> = {}): void {
    console.warn(message, { ...metadata, context: this.context, severity: "WARN", timestamp: new Date().toISOString() });
  }

  error(message: string, metadata: Record<string, unknown> = {}): void {
    console.error(message, { ...metadata, context: this.context, severity: "ERROR", timestamp: new Date().toISOString() });
  }
}
