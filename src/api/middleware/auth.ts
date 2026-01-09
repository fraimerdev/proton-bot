import type { RouteMiddleware } from "../../types/route";

/**
 * Basic authentication middleware stub.
 * Implement your authentication logic here (e.g., JWT validation, API key checks).
 */
export const authMiddleware: RouteMiddleware = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json({ error: "Unauthorized", message: "Missing Authorization header" }, 401);
  }

  // TODO: Implement your authentication logic here
  // Example: Validate JWT token, check API key, etc.
  // const token = authHeader.replace("Bearer ", "");
  // const isValid = await validateToken(token);
  // if (!isValid) {
  //   return c.json({ error: "Unauthorized", message: "Invalid token" }, 401);
  // }

  await next();
};
