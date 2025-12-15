import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import routers from "#composition/routers";
import type { Router } from "#composition/routers/router.types";
import { StepType } from "#composition/steps/step.types";
import ApplicationContext from "./context";

function register(app: Elysia, router: Router) {
  const { method, path, steps, documentation, schemas } = router;

  let route = new Elysia();

  for (const step of steps.before) {
    if (step.type === StepType.Provider) {
      route = route.resolve(
        async ({ request, params, ...$context }) =>
          await step.run({
            ...$context,
            method: request.method,
            parameters: params,
          }),
      );
    } else if (step.type === StepType.Effect) {
      route = route.onBeforeHandle(
        async ({ request, params, ...$context }) =>
          await step.run({
            ...$context,
            method: request.method,
            parameters: params,
          }),
      );
    }
  }

  route = route.route(
    method.toLowerCase(),
    path,
    async ({ set, params, request, ...$context }) => {
      const { data, status } = await steps.handler.run({
        ...$context,
        method: request.method,
        parameters: params,
      });

      set.status = status;

      return data;
    },
    {
      body: schemas.body,
      detail: documentation,
      response: schemas.responses,
    },
  );

  for (const step of steps.after) {
    route = route.onAfterResponse(
      async ({ responseValue, set, request, params, ...ctx }) =>
        await step.run({
          ...ctx,
          method: request.method,
          parameters: params,
          status: set.status as number,
          value: responseValue,
        }),
    );
  }

  app.use(route);
}

const application = new Elysia().use(ApplicationContext).use(
  openapi({
    documentation: {
      info: {
        description: "API documentation for Flex, providing details on available endpoints and usage.",
        title: "Documentation of Flex API",
        version: "0.0.4",
      },
    },
    path: "/documentation",
  }),
);

routers.forEach((router) => {
  register(application, router);
});

application.all(
  "*",
  ({ request, redirect }) => {
    const url = new URL(request.url);
    return redirect(`${url.origin}/documentation`);
  },
  { detail: { hide: true } },
);

type Application = typeof application;

export type { Application };

export { application };
