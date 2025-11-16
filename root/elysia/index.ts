import { openapi } from "@elysiajs/openapi";
import { ApplicationLogger } from "@shared/composition";
import type { HandlerContext } from "@shared/composition/handlers/handler.type";
import type { Router } from "@shared/composition/routers/router.type";
import { Elysia } from "elysia";
import { z } from "zod";

const logger = new ApplicationLogger();

export function initialize(routers: Router[]) {
  const app = new Elysia()
    .use(
      openapi({
        mapJsonSchema: { zod: z.toJSONSchema },
        path: "/documentation",
      }),
    )
    .derive(({ request }) => {
      return {
        logger: new ApplicationLogger({ method: request.method, url: request.url, uuid: crypto.randomUUID() }),
      };
    })
    .onBeforeHandle(({ logger }) => {
      logger.info("A new request has been received.");
    });

  logger.info(`Initializing ${routers.length} routes for Elysia.`);

  routers.forEach((router) => {
    const { method, path, handler, documentation, schemas } = router;

    app.route(
      method.toLowerCase(),
      path,
      async ({ body, params, query, headers, set }) => {
        const context = { body, headers, parameters: params, query };
        try {
          const { status, data } = await handler(context as HandlerContext);

          set.status = status;
          return data;
        } catch (error) {
          logger.error("Error executing route handler:", { message: (error as Error).message });
          set.status = 500;
          return { message: "Something unexpected happened. What have you done? What have we done?" };
        }
      },
      {
        body: schemas?.body,
        detail: {
          description: documentation?.description,
          summary: documentation?.summary,
          tags: documentation?.tags,
        },
        response: schemas?.responses,
      },
    );
  });

  app.listen(8787, ({ hostname, port }) => {
    logger.info(`The Elysia server is up and running on http://${hostname}:${port}.`);
  });
}
