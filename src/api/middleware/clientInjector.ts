import type { Client } from "../../base/client";
import type { RouteMiddleware, RouteVariables } from "../../types/route";

export function createClientInjector(client: Client<true>): RouteMiddleware {
  return async (c, next) => {
    c.set("client", client);
    await next();
  };
}
