import { z } from "@hono/zod-openapi";
import type { HandlerContext } from "../handlers/handler.type";
import type { Router } from "./router.type";

export default [
  {
    documentation: {
      description: "Is the API up and running?",
      summary: "Get the status of the API",
      tags: ["Status"],
    },
    handler: async (_context: HandlerContext) => {
      return { data: { message: "The API is up and running." }, status: 200 };
    },
    method: "GET",
    middlewares: [],
    path: "/status/healthcheck",
    schemas: {
      responses: {
        200: z.object({
          message: z.string().describe("The status of the API").default("The API is up and running."),
        }),
      },
    },
  },
  {
    documentation: {
      description: "What is the version of the API?",
      summary: "Get the version of the API",
      tags: ["Status"],
    },
    handler: async (_context: HandlerContext) => {
      return { data: { version: "0.0.1-alpha" }, status: 200 };
    },
    method: "GET",
    middlewares: [],
    path: "/status/version",
    schemas: {
      responses: {
        200: z.object({
          version: z.string().describe("The version of the API"),
        }),
      },
    },
  },
] as Router[];
