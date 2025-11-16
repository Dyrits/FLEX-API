# FLEX-API

A framework-agnostic API architecture demonstrating Clean Architecture principles with pluggable web framework adapters.

## 🎯 Architecture overview

This project implements a **layered architecture** where business logic is completely decoupled from web frameworks, allowing you to switch between Express, Hono, and Elysia with a single line change.

### Architectural layers

```
┌─────────────────────────────────────────────────────────────┐
│  root/* (Framework adapters)                                │
│  - Express, Hono, Elysia implementations                    │
│  - Only knows about composition layer                       │
│  - Translates composition contracts to framework specifics  │
└──────────────────────┬──────────────────────────────────────┘
                       │ imports Router[]
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  shared/composition/ (Application layer)                    │
│  - Routers: Define routes, handlers, schemas, docs          │
│  - Handlers: Orchestrate actions with dependency injection  │
│  - Middleware: Request pipeline interceptors                │
│  - ApplicationLogger: Configured logger instance            │
└──────────────────────┬──────────────────────────────────────┘
                       │ uses & injects dependencies
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  shared/core/ (Domain layer)                                │
│  - Actions: Pure use cases / business logic                 │
│  - Schemas: Domain models and validation                    │
│  - Agnostic to frameworks and infrastructure                │
└──────────────────────┬──────────────────────────────────────┘
                       │ depends on interfaces
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  shared/infrastructure/ (Infrastructure layer)              │
│  - Datasources: Database/storage implementations            │
│  - Loggers: Logging implementations                         │
│  - External services and technical concerns                 │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ Project structure

```
FLEX-API/
├── index.ts                    # Entry point - framework selector
├── tsconfig.json               # Single TypeScript config for all workspaces
├── package.json                # Root package with workspaces
│
├── root/                       # Framework adapters (Driving/Primary)
│   ├── express/
│   │   └── index.ts           # Express adapter implementation
│   ├── hono/
│   │   └── index.ts           # Hono adapter implementation
│   └── elysia/
│       └── index.ts           # Elysia adapter implementation
│
└── shared/                     # Framework-agnostic code
    ├── composition/            # Application/Composition layer
    │   ├── routers/           # Route definitions (path, method, handler, schemas)
    │   ├── handlers/          # Request handlers (orchestrate actions + DI)
    │   ├── middlewares/       # Request pipeline middleware
    │   ├── application-logger.ts
    │   └── default.configuration.ts
    │
    ├── core/                   # Domain layer (Business logic)
    │   ├── actions/           # Use cases (pure business logic)
    │   └── schemas/           # Domain models and validation
    │
    ├── infrastructure/         # Infrastructure layer (Driven/Secondary)
    │   ├── datasources/       # Database/storage implementations
    │   └── loggers/           # Logging implementations
    │
    └── common/                 # Shared utilities
```

## 🔄 Request flow

```
1. HTTP Request
   ↓
2. Framework adapter (root/express|hono|elysia)
   - Receives request in framework-specific format
   - Loads routers from composition layer
   ↓
3. Router (shared/composition/routers/)
   - Matches path and method
   - Validates request with Zod schemas
   - Calls associated handler
   ↓
4. Handler (shared/composition/handlers/)
   - Receives framework-agnostic HandlerContext
   - Instantiates required Actions (use cases)
   - Injects dependencies (datasources, loggers) into Actions
   - Orchestrates multiple actions if needed
   - Returns { status, data }
   ↓
5. Action (shared/core/actions/)
   - Pure business logic
   - Uses injected dependencies (via interfaces)
   - Returns domain entities/results
   ↓
6. Framework adapter
   - Translates response to framework format
   - Sends HTTP response
```

## 💡 Key concepts

### 1. Framework adapters (root/*)

Each framework adapter:
- Imports `routers` from `@shared/composition`
- Translates the generic `Router` type to framework-specific routes
- Handles framework-specific concerns (middleware, error handling, OpenAPI docs)
- **Never imports from `@shared/core` or `@shared/infrastructure` directly**

```typescript
// root/hono/index.ts
import routers from "@shared/composition/routers";

export function initialize(routers: Router[]) {
  routers.forEach((router) => {
    const { method, path, handler, schemas } = router;
    // Translate to Hono-specific implementation
  });
}
```

### 2. Composition layer (shared/composition/)

The **heart of the architecture** - this layer:
- Defines the application's public API (routers)
- Performs **dependency injection**
- Orchestrates use cases (actions)
- Acts as a boundary between frameworks and business logic

**Routers** define the contract:
```typescript
type Router = {
  method: HTTPMethod;
  path: string;
  handler: Handler;
  middlewares: IMiddleware[];
  documentation: Documentation;
  schemas: Schemas;  // Zod validation
};
```

**Handlers** compose actions with dependencies:
```typescript
export const createUserHandler: Handler = async (context) => {
  // Dependency Injection happens here
  const datasource = new PostgresUserDatasource();
  const logger = new ApplicationLogger(context);
  const action = new CreateUserAction(datasource, logger);
  
  // Execute use case
  const user = await action.execute(context.body);
  
  return { status: 201, data: user };
};
```

### 3. Core layer (shared/core/)

Contains **pure business logic**:
- Actions implement `IAction` interface
- Actions receive dependencies via constructor (Dependency Inversion)
- Completely agnostic to HTTP, frameworks, databases
- Highly testable with mocks

```typescript
export class CreateUserAction implements IAction {
  constructor(
    private datasource: IDatasource<UserInput, User>,
    private logger: ILogger
  ) {}
  
  async execute(payload: UserInput): Promise<User> {
    // Pure business logic
    this.logger.info("Creating user", { email: payload.email });
    const user = await this.datasource.store(payload);
    return user;
  }
}
```

### 4. Infrastructure layer (shared/infrastructure/)

Technical implementations:
- Concrete implementations of interfaces (ILogger, IDatasource)
- Database connections, file systems, external APIs
- No business logic
- Leaf nodes - don't depend on other layers

## 🚀 Getting started

### Prerequisites

- [Bun](https://bun.sh/) runtime installed

### Installation

```bash
bun install
```

### Running the application

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

### Available endpoints

- `GET /status/healthcheck` - Check if API is running
- `GET /status/version` - Get API version
- `GET /documentation` - Swagger UI (Hono & Elysia)

## 🧪 Architecture benefits

### 1. **Framework portability**
Switch from Express → Hono → Elysia with one line. Business logic never changes.

### 2. **Testability**
Test actions in isolation with mocked dependencies:
```typescript
const mockDatasource = { store: vi.fn() };
const mockLogger = { info: vi.fn() };
const action = new CreateUserAction(mockDatasource, mockLogger);
```

### 3. **Separation of concerns**
- Framework adapters handle HTTP concerns
- Composition layer handles orchestration
- Core layer handles business logic
- Infrastructure layer handles technical details

### 4. **Dependency inversion (SOLID)**
Core layer depends on **interfaces**, not implementations. Composition layer injects concrete implementations.

### 5. **Screaming architecture**
Folder structure reveals **what the app does** (users, orders, etc.) not **what framework it uses**.

## 🎓 Architectural patterns

This project implements:

- ✅ **Clean Architecture** (Robert C. Martin)
- ✅ **Hexagonal Architecture** (Ports & Adapters)
- ✅ **Dependency Inversion Principle** (SOLID)
- ✅ **Use Case Driven Design**
- ✅ **Framework-Agnostic Design**

## 📦 Technology stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Validation**: Zod
- **Frameworks**: Express, Hono, Elysia
- **OpenAPI**: @hono/zod-openapi, @elysiajs/openapi

## 🔧 Development

### Code quality

```bash
# Format and lint code
bun run check

# Format and lint with unsafe fixes
bun run check:unsafe
```

### Adding a new route

1. **Define the router** in `shared/composition/routers/`:
```typescript
export default [{
  method: "POST",
  path: "/users",
  handler: createUserHandler,
  middlewares: [],
  schemas: { ... },
  documentation: { ... }
}] as Router[];
```

2. **Create the handler** in `shared/composition/handlers/`:
```typescript
export const createUserHandler: Handler = async (context) => {
  // Instantiate action with dependencies
  const action = new CreateUserAction(datasource, logger);
  const result = await action.execute(context.body);
  return { status: 201, data: result };
};
```

3. **Implement the action** in `shared/core/actions/`:
```typescript
export class CreateUserAction implements IAction {
  constructor(private datasource: IDatasource) {}
  async execute(payload: any): Promise<any> {
    // Business logic here
  }
}
```

That's it! All three frameworks will automatically support the new route.

## 📝 Layer responsibilities

| Layer | Responsibility | Imports from | Exports to |
|-------|----------------|--------------|------------|
| `root/*` | Framework translation | `shared/composition` only | Nothing |
| `shared/composition/` | DI & orchestration | `shared/core` + `shared/infrastructure` | `root/*` |
| `shared/core/` | Business logic | `shared/infrastructure` (interfaces only) | `shared/composition` |
| `shared/infrastructure/` | Technical implementation | Nothing (leaf nodes) | `shared/core`, `shared/composition` |

## 🤝 Contributing

This is an educational/experimental project demonstrating architecture patterns. Feel free to explore and learn!