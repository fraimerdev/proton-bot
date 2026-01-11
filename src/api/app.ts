import { Hono } from "hono";

import type { Client } from "../base/client";
import type { RouteVariables } from "../types/route";
import { ENV } from "../utils/env";
import Logger from "../utils/logger";
import { createClientInjector } from "./middleware";
import { loadRoutes } from "../utils/api/loadRoutes";

export async function createApp(
  client: Client<true>,
  modulesDir: string,
  debug = false,
): Promise<Hono<{ Variables: RouteVariables }>> {
  const app = new Hono<{ Variables: RouteVariables }>();

  // Apply global middleware - inject client into context
  app.use("*", createClientInjector(client));

  // Load and register routes from modules
  const moduleRoutes = await loadRoutes(modulesDir, debug);

  for (const [moduleName, routes] of moduleRoutes) {
    for (const route of routes) {
      const fullPath = `/${moduleName}${route.path === "/" ? "" : route.path}`;

      // Apply route-specific middleware if defined
      const handlers = route.middleware ? [...route.middleware, route.handler] : [route.handler];

      switch (route.method) {
        case "GET":
          app.get(fullPath, ...handlers);
          break;
        case "POST":
          app.post(fullPath, ...handlers);
          break;
        case "PUT":
          app.put(fullPath, ...handlers);
          break;
        case "PATCH":
          app.patch(fullPath, ...handlers);
          break;
        case "DELETE":
          app.delete(fullPath, ...handlers);
          break;
      }
    }
  }

  // Default routes
  app.get("/", (c) => c.json({ status: "ok", message: "Proton Bot API" }));

  app.notFound((c) => c.json({ error: "Not Found" }, 404));

  app.onError((err, c) => {
    Logger.error("API Error", err);
    return c.json({ error: "Internal Server Error" }, 500);
  });

  return app;
}

/**
 * Starts the API server.
 */
export async function startApi(client: Client<true>, modulesDir = "modules", debug = false): Promise<boolean> {
  const port = ENV.PORT || 3000;

  try {
    const app = await createApp(client, modulesDir, debug);

    Bun.serve({
      port,
      fetch: app.fetch,
    });

    if (debug) Logger.success(`API server running on http://localhost:${port}`);
    return true;
  } catch (error) {
    Logger.error("Failed to start API server", error as Error);
    return false;
  }
}
