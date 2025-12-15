import type { TSchema } from "@sinclair/typebox";
import type { EffectStep, HandlerStep, ProviderStep } from "#composition/steps/step.types";

export type HTTPMethod =
  | (string & {})
  | "ACL"
  | "BIND"
  | "CHECKOUT"
  | "CONNECT"
  | "COPY"
  | "DELETE"
  | "GET"
  | "HEAD"
  | "LINK"
  | "LOCK"
  | "M-SEARCH"
  | "MERGE"
  | "MKACTIVITY"
  | "MKCALENDAR"
  | "MKCOL"
  | "MOVE"
  | "NOTIFY"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PROPFIND"
  | "PROPPATCH"
  | "PURGE"
  | "PUT"
  | "REBIND"
  | "REPORT"
  | "SEARCH"
  | "SOURCE"
  | "SUBSCRIBE"
  | "TRACE"
  | "UNBIND"
  | "UNLINK"
  | "UNLOCK"
  | "UNSUBSCRIBE"
  | "ALL";

type Documentation = {
  description: string;
  summary: string;
  tags: Array<string>;
};

type Schemas = {
  body?: TSchema;
  parameters?: TSchema;
  query?: TSchema;
  headers?: TSchema;
  responses: Record<number, TSchema>;
};

export type Router = {
  method: HTTPMethod;
  path: string;
  steps: {
    before: Array<ProviderStep | EffectStep>;
    handler: HandlerStep;
    after: Array<EffectStep>;
  };
  documentation: Documentation;
  schemas: Schemas;
};
