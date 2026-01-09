import { createRoute } from "../../../utils/create";

export const route = createRoute({
  method: "GET",
  path: "/health",
  handler: (c) => {
    const client = c.get("client");

    return c.json({
      status: "ok",
      ready: client.isReady(),
      uptime: client.uptime,
      ping: client.ws.ping,
    });
  },
});
