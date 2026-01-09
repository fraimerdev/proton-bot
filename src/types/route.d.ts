import type { Context, MiddlewareHandler, Next } from "hono";

import type { Client } from "../base/client";

export type RouteMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RouteVariables = {
  client: Client<true>;
};

export type RouteContext = Context<{ Variables: RouteVariables }>;

export type RouteHandler = (c: RouteContext) => Response | Promise<Response>;

export type RouteMiddleware = MiddlewareHandler<{ Variables: RouteVariables }>;

export interface Route {
  method: RouteMethod;
  path: string;
  middleware?: RouteMiddleware[];
  handler: RouteHandler;
}

export type AnyRoute = Route;
