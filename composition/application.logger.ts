import { $ApplicationLogger } from "#composition/configuration";
import type ILogger from "#infrastructure/loggers/logger.interface";

class ApplicationLogger implements ILogger {
  private logger: ILogger;

  constructor(public context: Record<string, unknown> = {}) {
    this.logger = new $ApplicationLogger(context);
  }

  debug(message: string, metadata: Record<string, unknown> = {}): void {
    this.logger.debug(message, metadata);
  }
  info(message: string, metadata: Record<string, unknown> = {}): void {
    this.logger.info(message, metadata);
  }
  warn(message: string, metadata: Record<string, unknown> = {}): void {
    this.logger.warn(message, metadata);
  }
  error(message: string, metadata: Record<string, unknown> = {}): void {
    this.logger.error(message, metadata);
  }
}

export default ApplicationLogger;
