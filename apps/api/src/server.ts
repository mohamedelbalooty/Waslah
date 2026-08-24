import { pathToFileURL } from "node:url";
import express from "express";
import { SHARED_TYPES_VERSION } from "@waslah/shared-types";
import { healthRouter } from "./routes/health.js";

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(healthRouter);

  return app;
}

export function start(): void {
  const port = Number(process.env.PORT ?? 4000);
  const app = createApp();

  app.listen(port, () => {
    console.log(
      `[api] listening on port ${port} (shared contracts ${SHARED_TYPES_VERSION})`,
    );
  });
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  start();
}
