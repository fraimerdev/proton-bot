import { createRoute } from "../../../../../utils/create";

export const route = createRoute({
  method: "GET",
  path: "/xp",
  handler: async (c) => {
    const client = c.get("client");
    const userId = c.req.param("userId");
    const guildId = c.req.query("guildId");

    if (!userId) {
      return c.json({ error: "userId is required" }, 400);
    }

    const where = guildId ? { userId, guildId } : { userId };

    const levels = await client.db.level.findMany({
      where,
      orderBy: { xpTotal: "desc" },
    });

    if (levels.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    // If guildId was specified, return single level entry
    if (guildId) {
      const level = levels[0];
      return c.json({
        userId: level.userId,
        guildId: level.guildId,
        xpTotal: level.xpTotal,
        xpCurrent: level.xpCurrent,
        level: level.level,
      });
    }

    // Otherwise return all guild levels for this user
    return c.json({
      userId,
      levels: levels.map((level) => ({
        guildId: level.guildId,
        xpTotal: level.xpTotal,
        xpCurrent: level.xpCurrent,
        level: level.level,
      })),
    });
  },
});
