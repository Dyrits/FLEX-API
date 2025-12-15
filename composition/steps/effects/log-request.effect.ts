import type ApplicationLogger from "#composition/application.logger";
import type { ApplicationRequestContext } from "#composition/application.types";
import build from "./effect.build";

export default build<Partial<ApplicationRequestContext> & { logger: ApplicationLogger }>(async ({ logger, method, path, body, query, parameters }) => {
  logger.info(`⚡️ Calling [${method}] ${path}`, { body: body || {}, parameters: parameters || {}, query: query || {} });
});
