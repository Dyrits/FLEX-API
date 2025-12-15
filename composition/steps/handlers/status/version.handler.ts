import build from "#composition/steps/handlers/handler.build";

export default build(async () => {
  return {
    data: { version: "0.0.4" },
    status: 200,
  };
});
