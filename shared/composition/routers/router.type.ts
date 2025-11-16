import type { ZodType } from "zod";
import type { Handler } from "../handlers/handler.type";
import type IMiddleware from "../middlewares/middleware.interface";

export type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type Documentation = {
  description: string;
  summary: string;
  tags: string[];
};

type Schemas = {
  body?: ZodType;
  parameters?: ZodType;
  query?: ZodType;
  headers?: ZodType | ZodType[];
  responses: Record<number, ZodType>;
};

export type Router = {
  method: HTTPMethod;
  path: string;
  handler: Handler;
  middlewares: IMiddleware[];
  documentation: Documentation;
  schemas: Schemas;
};
