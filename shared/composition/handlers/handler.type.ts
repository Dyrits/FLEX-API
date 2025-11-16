export type HandlerContext = {
  body: Record<string, unknown>;
  headers: Record<string, unknown>;
  parameters: Record<string, unknown>;
  query: Record<string, unknown>;
};

type HandlerResponse = {
  data: Record<string, unknown>;
  status: number;
};

export type Handler = (context: HandlerContext) => Promise<HandlerResponse>;
