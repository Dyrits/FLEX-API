import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { ApplicationLogger } from "@shared/composition";
import type { HTTPMethod, Router } from "@shared/composition/routers/router.type";
import type { ContentfulStatusCode, ContentlessStatusCode } from "hono/utils/http-status";
import { type ZodObject, type ZodType, z } from "zod";

const app = new OpenAPIHono<{ Variables: { logger: ApplicationLogger } }>();

app.use("*", async (context, next) => {
  context.set("logger", new ApplicationLogger({ method: context.req.method, url: context.req.url, uuid: crypto.randomUUID() }));
  context.get("logger").info("A new request has been received.");
  await next();
});

export function initialize(routers: Router[]) {
  const logger = new ApplicationLogger();
  logger.info(`Initializing ${routers.length} routes for Hono.`);

  routers.forEach((router) => {
    const { method, path, handler, documentation, schemas } = router;

    const request = {
      body: {
        content: {
          "application/json": {
            schema: schemas.body as ZodObject,
          },
        },
      },
      headers: schemas.headers as ZodObject,
      params: schemas.parameters as ZodObject,
      query: schemas.query as ZodObject,
    };

    // @ts-expect-error : The property is possibly undefined.
    schemas.body || delete request.body;
    // @ts-expect-error : The property is possibly undefined.
    schemas.headers || delete request.headers;
    // @ts-expect-error : The property is possibly undefined.
    schemas.parameters || delete request.params;
    // @ts-expect-error : The property is possibly undefined.
    schemas.query || delete request.query;

    app.openapi(
      createRoute({
        ...documentation,
        method: method.toLowerCase() as Lowercase<HTTPMethod>,
        path,
        request,
        responses: Object.entries(schemas.responses || {}).reduce(
          ($responses, [status, schema]) => {
            $responses[Number(status)] = {
              content: {
                "application/json": {
                  schema: schema,
                },
              },
              description: "API Response",
            };
            return $responses;
          },
          {
            500: {
              content: {
                "application/json": {
                  schema: z.object({
                    message: z.string(),
                  }),
                },
              },
              description: "Internal Server Error",
            },
          } as Record<number, { content: { "application/json": { schema: ZodType } }; description: string }>,
        ),
      }),
      // @ts-expect-error : Hono's handler except to explicitly cover every status code.
      async (context) => {
        try {
          const query = schemas.query && context.req.valid("query");
          const body = schemas.body && context.req.valid("json");
          const parameters = schemas.parameters && context.req.valid("param");
          const headers = schemas.parameters && context.req.valid("header");

          const { status, data } = await handler({
            body: body || {},
            headers: headers || {},
            parameters: parameters || {},
            query: query || {},
          });

          if (data) {
            return context.json(data, status as ContentfulStatusCode);
          }

          context.status(status as ContentlessStatusCode);
          return context.body(null);
        } catch (error) {
          context.get("logger").error("Error executing route handler:", { message: (error as Error).message });

          return context.json({ message: "Something unexpected happened. What have you done? What have we done?" }, 500);
        }
      },
    );
  });

  app.doc("/json-documentation", {
    info: {
      title: "Flex API",
      version: "0.0.1-alpha",
    },
    openapi: "3.0.0",
  });

  app.get("/documentation", swaggerUI({ url: "/json-documentation" }));

  serve({
    fetch: app.fetch,
    port: 8787,
  });

  logger.info("The Hono server is up and running on http://localhost:8787.");
}

export default app;
