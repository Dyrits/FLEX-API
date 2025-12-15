import type ApplicationLogger from "#composition/application.logger";
import type { ApplicationResponseContext } from "#composition/application.types";
import build from "./effect.build";

export default build<Partial<ApplicationResponseContext> & { logger: ApplicationLogger }>(async ({ logger, method, path, status, value }) => {
  logger.info(`⚡️ [${method}] ${path} - Operation completed with status: ${status}`, { response: value });
});
