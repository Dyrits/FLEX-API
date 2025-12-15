import { Type } from "@sinclair/typebox";
import { StatusHealthcheckHandler } from "#composition/steps/handlers";
import type { Router } from "./router.types";

export default {
  healthcheck: {
    documentation: {
      description: "Is the API up and running?",
      summary: "Get the status of the API",
      tags: ["Status"],
    },
    method: "GET",
    path: "/status/healthcheck",
    schemas: {
      responses: {
        200: Type.Object({
          message: Type.String({
            default: "The API is up and running.",
            description: "The status of the API",
          }),
        }),
      },
    },
    steps: { after: [], before: [], handler: StatusHealthcheckHandler },
  },
  version: {
    documentation: {
      description: "What is the version of the API?",
      summary: "Get the version of the API",
      tags: ["Status"],
    },
    method: "GET",
    path: "/status/version",
    schemas: {
      responses: {
        200: Type.Object({
          version: Type.String({
            default: "0.0.4",
            description: "The version of the API",
          }),
        }),
      },
    },
    steps: { after: [], before: [], handler: StatusHealthcheckHandler },
  },
} as Record<string, Router>;
