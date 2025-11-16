type MiddlewareContext = {
  body: Record<string, unknown>;
  headers: Record<string, string>;
  parameters: Record<string, string>;
  query: Record<string, string>;
};

type MiddlewareResponse = MiddlewareContext;

export default interface IMiddleware {
  handle(context: MiddlewareContext): Promise<MiddlewareResponse>;
}
