import type { ApplicationRequestContext, ApplicationResponseContext } from "#composition/application.types";

export enum StepType {
  Provider = "Provider",
  Effect = "Effect",
  Handler = "Handler",
}

export type Step<TContext = ApplicationRequestContext | ApplicationResponseContext> = ProviderStep<TContext> | EffectStep<TContext> | HandlerStep<TContext>;

export type EffectStep<TContext = ApplicationRequestContext | ApplicationResponseContext> = {
  type: StepType.Effect;
  run: (context: TContext) => Promise<void>;
};

export type ProviderStep<TContext = ApplicationRequestContext, TReturn extends Record<string, unknown> = Record<string, unknown>> = {
  type: StepType.Provider;
  run: (context: TContext) => Promise<TReturn>;
};

export type HandlerResponse = {
  data: Record<string, unknown>;
  status: number;
};

export type HandlerStep<TContext = ApplicationRequestContext> = {
  type: StepType.Handler;
  run: (context: TContext) => Promise<HandlerResponse>; // { status, data }
};
