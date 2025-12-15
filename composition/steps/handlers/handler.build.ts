import { type HandlerResponse, type HandlerStep, StepType } from "#composition/steps/step.types";

export default function build<TContext>(run: (context: TContext) => Promise<HandlerResponse>) {
  return {
    run,
    type: StepType.Handler,
  } as HandlerStep<TContext>;
}
