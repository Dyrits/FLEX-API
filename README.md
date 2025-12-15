# FLEX-API

A framework-agnostic API architecture demonstrating Clean Architecture principles with pluggable web framework adapters and a step-based request pipeline.

## Architecture Overview

This project implements a **layered architecture** where business logic is completely decoupled from web frameworks, allowing you to switch between Express, Hono, and Elysia with a single configuration change.

### Architectural Layers

```
┌─────────────────────────────────────────────────────────────┐
│  application/* (Framework Adapters)                         │
│  - Express, Hono, Elysia implementations                    │
│  - Registers routes using composition layer contracts       │
│  - Executes step-based request pipeline                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ imports Router[], ApplicationSteps
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  composition/ (Application Layer)                           │
│  - Routers: Define routes with steps, schemas, docs         │
│  - Steps: Providers, Effects, Handlers                      │
│  - ApplicationLogger: Configured logger instance            │
│  - ApplicationSteps: Global before/after pipeline           │
└──────────────────────┬──────────────────────────────────────┘
                       │ uses
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  core/ (Domain Layer)                                       │
│  - Actions: Pure use cases / business logic                 │
│  - Schemas: Domain models and validation                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ depends on interfaces
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  infrastructure/ (Infrastructure Layer)                     │
│  - Loggers: Logging implementations                         │
│  - Datasources: Database/storage implementations            │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
FLEX-API/
├── index.ts                        # Entry point - framework selector & server
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies
│
├── application/                    # Framework Adapters
│   ├── express/
│   │   └── index.ts               # Express adapter with TypeBox validation
│   ├── hono/
│   │   └── index.ts               # Hono adapter with OpenAPI support
│   └── elysia/
│       ├── index.ts               # Elysia adapter with OpenAPI support
│       └── context.ts             # Global application context (steps)
│
├── composition/                    # Application Layer
│   ├── application.steps.ts       # Global before/after steps
│   ├── application.types.ts       # Context type definitions
│   ├── application.logger.ts      # Logger factory
│   ├── routers/
│   │   ├── router.types.ts        # Router type definition
│   │   ├── index.ts               # Router aggregation
│   │   └── status.router.ts       # Status endpoints
│   └── steps/
│       ├── step.types.ts          # Step type definitions
│       ├── providers/             # Dependency providers (inject into context)
│       │   ├── provider.build.ts
│       │   ├── logger.provider.ts
│       │   └── index.ts
│       ├── effects/               # Side effects (logging, monitoring)
│       │   ├── effect.build.ts
│       │   ├── log-request.effect.ts
│       │   ├── log-response.effect.ts
│       │   └── index.ts
│       └── handlers/              # Request handlers
│           ├── handler.build.ts
│           ├── index.ts
│           └── status/
│               ├── healthcheck.handler.ts
│               └── version.handler.ts
│
├── core/                           # Domain Layer
│   └── actions/
│       └── actions.interface.ts   # Action interface
│
└── infrastructure/                 # Infrastructure Layer
    └── loggers/
        ├── logger.interface.ts
        ├── console.logger.ts
        └── index.ts
```

## Step-Based Request Pipeline

The architecture uses a **step-based pipeline** for handling requests. Each route can define steps that run before and after the handler.

### Step Types

| Type | Purpose | When it runs |
|------|---------|--------------|
| **Provider** | Injects dependencies into context | Before handler |
| **Effect** | Side effects (logging, validation) | Before or after handler |
| **Handler** | Core request logic | Processes the request |

### Pipeline Flow

```
Request
   ↓
┌─────────────────────────────────────┐
│  Global Before Steps                │
│  (from application.steps.ts)        │
│  - LoggerProvider → injects logger  │
│  - LogRequestEffect → logs request  │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  Route Before Steps                 │
│  (from router.steps.before)         │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  Handler                            │
│  (from router.steps.handler)        │
│  Returns { status, data }           │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  Route After Steps                  │
│  (from router.steps.after)          │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  Global After Steps                 │
│  (from application.steps.ts)        │
│  - LogResponseEffect → logs response│
└─────────────────┬───────────────────┘
                  ↓
Response
```

### Request Context

All steps receive a consistent context across frameworks:

```typescript
type ApplicationRequestContext = {
  body: Record<string, unknown> | unknown;
  headers: Record<string, unknown> | Headers;
  parameters: Record<string, unknown>;
  cookie: Record<string, unknown>;
  query: Record<string, string>;
  path: string;
  method: HTTPMethod;
};
```

## Router Definition

Routers define routes with their steps and schemas:

```typescript
export default {
  healthcheck: {
    method: "GET",
    path: "/status/healthcheck",
    steps: {
      before: [],                    // Route-specific before steps
      handler: StatusHealthcheckHandler,
      after: [],                     // Route-specific after steps
    },
    schemas: {
      body: Type.Object({ ... }),    // TypeBox schema (optional)
      query: Type.Object({ ... }),   // TypeBox schema (optional)
      parameters: Type.Object({ ... }), // TypeBox schema (optional)
      responses: {
        200: Type.Object({ message: Type.String() }),
      },
    },
    documentation: {
      summary: "Get the status of the API",
      description: "Is the API up and running?",
      tags: ["Status"],
    },
  },
} as Record<string, Router>;
```

## Creating Steps

### Provider (Dependency Injection)

```typescript
// composition/steps/providers/logger.provider.ts
import build from "./provider.build";

export default build<Partial<ApplicationRequestContext>, { logger: ApplicationLogger }>(
  async ({ method, path }) => {
    return { logger: new ApplicationLogger({ method, path, uuid: crypto.randomUUID() }) };
  }
);
```

### Effect (Side Effects)

```typescript
// composition/steps/effects/log-request.effect.ts
import build from "./effect.build";

export default build<Partial<ApplicationRequestContext> & { logger: ApplicationLogger }>(
  async ({ logger, method, path, body, query, parameters }) => {
    logger.info(`Calling [${method}] ${path}`, { body, parameters, query });
  }
);
```

### Handler

```typescript
// composition/steps/handlers/status/healthcheck.handler.ts
import build from "../handler.build";

export default build(async () => {
  return {
    status: 200,
    data: { message: "The API is up and running." },
  };
});
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime installed

### Installation

```bash
bun install
```

### Running the Application

Switch between frameworks by editing `index.ts`:

```typescript
enum Framework {
  Express = "express",
  Elysia = "elysia",
  Hono = "hono",
}

const framework = Framework.Hono;  // Change this line
```

Then run:

```bash
bun --watch index.ts
```

The API will be available at `http://localhost:8787`

### Available Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /status/healthcheck` | Check if API is running |
| `GET /status/version` | Get API version |
| `GET /documentation` | OpenAPI documentation (Hono & Elysia) |

## Framework Adapters

Each adapter implements the same pattern:

1. **Register routes** using the `register(app, router)` function
2. **Execute before steps** (providers then effects)
3. **Run the handler**
4. **Execute after steps**

### Express

- Uses `response.on("finish")` for after steps
- TypeBox validation with `Value.Parse()`
- No built-in OpenAPI support

### Hono

- Uses `@hono/zod-openapi` for OpenAPI documentation
- TypeBox validation with `Value.Parse()`
- Swagger UI at `/documentation`

### Elysia

- Uses `@elysiajs/openapi` for OpenAPI documentation
- Native TypeBox schema support
- Global context via `context.ts` applies application steps

## Validation

Schemas are defined using [TypeBox](https://github.com/sinclairzx81/typebox) and validated at runtime:

```typescript
import { Type } from "@sinclair/typebox";

schemas: {
  body: Type.Object({
    name: Type.String(),
    email: Type.String({ format: "email" }),
  }),
  responses: {
    200: Type.Object({ id: Type.String(), name: Type.String() }),
    400: Type.Object({ message: Type.String() }),
  },
}
```

## Architecture Benefits

### 1. Framework Portability
Switch from Express to Hono to Elysia with one configuration change. Business logic never changes.

### 2. Step-Based Pipeline
Composable request processing with clear separation between dependency injection (providers), side effects (effects), and business logic (handlers).

### 3. Testability
Test handlers in isolation:
```typescript
const result = await StatusHealthcheckHandler.run({});
expect(result.status).toBe(200);
```

### 4. Type Safety
Full TypeScript support with typed contexts flowing through the pipeline.

### 5. Consistent Context
Same request context shape across all frameworks.

## Technology Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Validation**: TypeBox
- **Frameworks**: Express, Hono, Elysia
- **OpenAPI**: @hono/zod-openapi, @elysiajs/openapi

## Development

### Code Quality

```bash
bun run check        # Format and lint
bun run check:unsafe # Format and lint with unsafe fixes
```

### Adding a New Route

1. **Create the handler** in `composition/steps/handlers/`:
```typescript
export default build(async (context) => {
  return { status: 200, data: { result: "success" } };
});
```

2. **Define the router** in `composition/routers/`:
```typescript
export default {
  myRoute: {
    method: "POST",
    path: "/my-route",
    steps: { before: [], handler: MyHandler, after: [] },
    schemas: { responses: { 200: Type.Object({ result: Type.String() }) } },
    documentation: { summary: "My route", description: "...", tags: ["MyTag"] },
  },
} as Record<string, Router>;
```

3. **Export from routers index**:
```typescript
import MyRouter from "./my.router";
export default ([] as Router[]).concat(Object.values(StatusRouter), Object.values(MyRouter));
```

All three frameworks will automatically support the new route.
