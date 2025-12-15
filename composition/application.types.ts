import type { HTTPMethod } from "#composition/routers/router.types";
import type { EffectStep, ProviderStep } from "./steps/step.types";

export type ApplicationRequestContext = {
  body: Record<string, unknown> | unknown;
  headers: Record<string, unknown> | Headers;
  parameters: Record<string, unknown>;
  cookie: Record<string, unknown>;
  query: Record<string, string>;
  path: string;
  method: HTTPMethod;
};

export type ApplicationResponseContext = {
  method: HTTPMethod;
  path: string;
  status: number;
  value: unknown;
};

export type ApplicationSteps = {
  before: Array<EffectStep | ProviderStep>;
  after: Array<EffectStep>;
};
