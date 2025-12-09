import { Hono } from "hono";

import { client } from "../index";
import { ENV } from "../utils/env";
import Logger from "../utils/logger";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello World!");
});

app.get("/ready", (c) => {
  return c.json({
    status: client.isReady(),
  });
});

app.notFound((c) => {
  return c.text("Not Found", 404);
});

export async function startApi(debug = false): Promise<boolean> {
  const port = ENV.PORT || 3000;
  try {
    Bun.serve({
      port,
      fetch: app.fetch,
    });
    if (debug) Logger.success(`Server is running on http://localhost:${port}`);
    return true;
  } catch (error) {
    Logger.error("Failed to start API server", error as Error);
    return false;
  }
}
