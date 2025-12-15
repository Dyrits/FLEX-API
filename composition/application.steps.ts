import type { ApplicationSteps } from "./application.types";
import { LogRequestEffect, LogResponseEffect } from "./steps/effects";
import { LoggerProvider } from "./steps/providers";

export default {
  after: [LogResponseEffect],
  before: [LoggerProvider, LogRequestEffect],
} as ApplicationSteps;
