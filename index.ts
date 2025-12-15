import { serve } from "@hono/node-server";

enum Framework {
  Express = "express",
  Elysia = "elysia",
  Hono = "hono",
}

const framework = Framework.Elysia;
const port = 8787;

(async () => {
  const { application } = await import(`./application/${framework}`);

  switch (framework as Framework) {
    case Framework.Hono:
      serve({
        fetch: application.fetch,
        port,
      });
      break;

    case Framework.Express:
    case Framework.Elysia:
      application.listen(port);
      break;
  }
})();
