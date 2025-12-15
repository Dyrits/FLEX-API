import ApplicationLogger from "#composition/application.logger";
import type { ApplicationRequestContext } from "#composition/application.types";
import build from "./provider.build";

export default build<Partial<ApplicationRequestContext>, { logger: ApplicationLogger }>(async ({ method, path }) => {
  return { logger: new ApplicationLogger({ method: method, path, uuid: crypto.randomUUID() }) };
});
