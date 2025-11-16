import { ApplicationLogger } from "@shared/composition";
import type { HandlerContext } from "@shared/composition/handlers/handler.type";
import type { HTTPMethod, Router } from "@shared/composition/routers/router.type";
import express, { type NextFunction, type Request, type Response } from "express";

declare global {
  namespace Express {
    interface Request {
      logger: ApplicationLogger;
    }
  }
}

const app = express();
const logger = new ApplicationLogger();

app.use(express.json());

app.use((request: Request, _response: Response, next: NextFunction) => {
  request.logger = new ApplicationLogger({ method: request.method, url: request.url, uuid: crypto.randomUUID() });
  request.logger.info("A new request has been received.");
  next();
});

export function initialize(routers: Router[]) {
  logger.info(`Initializing ${routers.length} routes for Express.`);

  routers.forEach((router) => {
    const { method, path, handler } = router;

    app[method.toLowerCase() as Lowercase<HTTPMethod>](path, async (request: Request, response: Response) => {
      const context = { body: request.body, headers: request.headers, parameters: request.params, query: request.query };
      try {
        const { status, data } = await handler(context as HandlerContext);

        response.status(status).json(data);
      } catch (error) {
        request.logger.error("Error executing route handler:", { message: (error as Error).message });
        response.status(500).json({ message: "Something unexpected happened. What have you done? What have we done?" });
      }
    });
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Are you lost? There is nothing here." });
  });

  app.listen(8787, () => {
    logger.info("The Express server is up and running on http://localhost:8787.");
  });
}
