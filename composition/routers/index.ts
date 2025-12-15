import type { Router } from "./router.types";
import StatusRouter from "./status.router";

export { StatusRouter };
export default ([] as Router[]).concat(Object.values(StatusRouter));
