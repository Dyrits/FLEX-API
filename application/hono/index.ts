import { swaggerUI } from "@hono/swagger-ui";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { Value } from "@sinclair/typebox/value";
import type { TSchema } from "elysia";
import { getCookie } from "hono/cookie";
import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status";
import type { ApplicationRequestContext } from "#composition/application.types";
import routers from "#composition/routers";
import type { Router } from "#composition/routers/router.types";
import { StepType } from "#composition/steps/step.types";

type HonoMethod = "get" | "post" | "put" | "delete" | "patch" | "options" | "head";

const application = new OpenAPIHono();

function register(app: OpenAPIHono, router: Router) {
  const { method, path, steps, documentation, schemas } = router;

  const request: Record<string, unknown> = {};

  if (schemas.body) {
    request.body = {
      content: {
        "application/json": {
          schema: schemas.body,
        },
      },
    };
  }

  if (schemas.headers) {
    request.headers = schemas.headers;
  }

  if (schemas.parameters) {
    request.params = schemas.parameters;
  }

  if (schemas.query) {
    request.query = schemas.query;
  }

  app.openapi(
    createRoute({
      ...documentation,
      method: method.toLowerCase() as HonoMethod,
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
        {} as Record<
          number,
          {
            content: { "application/json": { schema: TSchema } };
            description: string;
          }
        >,
      ),
    }),
    // @ts-expect-error : Hono's handler except to explicitly cover every status code.
    async (context) => {
      const body = schemas.body ? Value.Parse(schemas.body, await context.req.json()) : context.req.json();
      const headers = schemas.headers ? Value.Parse(schemas.headers, Object.fromEntries(context.req.raw.headers.entries())) : context.req.raw.headers;
      const parameters = schemas.parameters ? Value.Parse(schemas.parameters, context.req.param()) : context.req.param();
      const query = schemas.query ? Value.Parse(schemas.query, context.req.query()) : context.req.query();

      const $context = {
        body,
        cookie: getCookie(context) || {},
        headers,
        method: context.req.method,
        parameters,
        path: context.req.path,
        query,
      } as ApplicationRequestContext;

      // Run before steps (providers and effects)
      for (const step of steps.before) {
        if (step.type === StepType.Provider) {
          const provided = await step.run($context);
          Object.assign($context, provided);
        } else if (step.type === StepType.Effect) {
          await step.run($context);
        }
      }

      // Run the handler
      const { data, status } = await steps.handler.run($context);

      // Run after steps
      for (const step of steps.after) {
        await step.run({ ...$context, status, value: data });
      }

      if (data) {
        return context.json(data, status as ContentfulStatusCode);
      }

      context.status(status as StatusCode);
      return context.body(null);
    },
  );
}

routers.forEach((router) => {
  register(application, router);
});

application.doc("/json-documentation", {
  info: {
    title: "Flex API",
    version: "0.0.1-alpha",
  },
  openapi: "3.0.0",
});

application.get("/documentation", swaggerUI({ url: "/json-documentation" }));

export { application };
