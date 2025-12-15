import build from "#composition/steps/handlers/handler.build";

export default build(async () => {
  return {
    data: { message: "The API is up and running." },
    status: 200,
  };
});
