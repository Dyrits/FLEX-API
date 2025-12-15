import { type EffectStep, StepType } from "#composition/steps/step.types";

export default function build<TContext>(run: (context: TContext) => Promise<void>) {
  return {
    run,
    type: StepType.Effect,
  } as EffectStep<TContext>;
}
