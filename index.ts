import routers from "@shared/composition/routers";

enum Framework {
  Express = "express",
  Elysia = "elysia",
  Hono = "hono",
}

const framework = Framework.Hono;

(async () => {
  const implementation = await import(`./root/${framework}`);
  implementation.initialize(routers);
})();
