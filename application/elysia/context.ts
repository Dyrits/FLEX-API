import { Elysia } from "elysia";
import steps from "#composition/application.steps";
import { StepType } from "#composition/steps/step.types";

let context = new Elysia({
  name: "ApplicationContext",
  seed: "ApplicationContext",
});

for (const step of steps.before) {
  if (step.type === StepType.Provider) {
    context = context.derive(
      { as: "global" },
      async ({ request, params, ...$context }) => await step.run({ ...$context, method: request.method, parameters: params }),
    );
  } else if (step.type === StepType.Effect) {
    context = context.onBeforeHandle(
      { as: "global" },
      async ({ request, params, ...$context }) => await step.run({ ...$context, method: request.method, parameters: params }),
    );
  }
}

for (const step of steps.after) {
  context = context.onAfterResponse(
    { as: "global" },
    async ({ responseValue, set, request, params, ...$context }) =>
      await step.run({
        ...$context,
        method: request.method,
        parameters: params,
        status: set.status as number,
        value: responseValue,
      }),
  );
}

export default context;
