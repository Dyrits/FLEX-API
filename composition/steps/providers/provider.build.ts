import { type ProviderStep, StepType } from "#composition/steps/step.types";

export default function build<TContext, TReturn extends Record<string, unknown> = Record<string, unknown>>(run: (context: TContext) => Promise<TReturn>) {
  return {
    run,
    type: StepType.Provider,
  } as ProviderStep<TContext, TReturn>;
}
