import { Value } from "@sinclair/typebox/value";
import express, { type Request, type Response } from "express";
import type { ApplicationRequestContext } from "#composition/application.types";
import routers from "#composition/routers";
import type { Router } from "#composition/routers/router.types";
import { StepType } from "#composition/steps/step.types";

type ExpressMethod = "get" | "post" | "put" | "delete" | "patch" | "options" | "head" | "all";

const application = express();

application.use(express.json());

function register(app: express.Application, router: Router) {
  const { method, path, steps, schemas } = router;
  const $method = method.toLowerCase() as ExpressMethod;

  app[$method](path, async (request: Request, response: Response) => {
    const headers = schemas.headers ? Value.Parse(schemas.headers, request.headers) : request.headers;
    const body = schemas.body ? Value.Parse(schemas.body, request.body) : request.body;
    const parameters = schemas.parameters ? Value.Parse(schemas.parameters, request.params) : request.params;
    const query = schemas.query ? Value.Parse(schemas.query, request.query) : request.query;

    const context = {
      body,
      cookie: request.cookies || {},
      headers,
      method: request.method,
      parameters,
      path: request.path,
      query,
    } as ApplicationRequestContext;

    // Run before steps (providers and effects)
    for (const step of steps.before) {
      if (step.type === StepType.Provider) {
        const provided = await step.run(context);
        Object.assign(context, provided);
      } else if (step.type === StepType.Effect) {
        await step.run(context);
      }
    }

    // Run the handler
    const { data, status } = await steps.handler.run(context);

    // Register after steps to run on response finish
    response.on("finish", async () => {
      for (const step of steps.after) {
        await step.run({
          ...context,
          status: response.statusCode,
          value: data,
        });
      }
    });

    response.status(status).json(data);
  });
}

routers.forEach((router) => {
  register(application, router);
});

application.use((_request: Request, response: Response) => {
  response.status(404).json({ message: "Are you lost? There is nothing here." });
});

export { application };
