import { createRoute } from "../../../utils/create";

export const route = createRoute({
  method: "GET",
  path: "/stats",
  handler: (c) => {
    const client = c.get("client");

    return c.json({
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
      channels: client.channels.cache.size,
      commands: client.commands.applicationCommands.size,
    });
  },
});
