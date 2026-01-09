import { createRoute } from "../../../utils/create";

/**
 * GET /leveling/leaderboard
 * Returns the top users by XP across all guilds or for a specific guild.
 *
 * Query params:
 *   - guildId (optional): Filter leaderboard to a specific guild
 *   - limit (optional): Number of users to return (default: 10, max: 100)
 */
export const route = createRoute({
  method: "GET",
  path: "/leaderboard",
  handler: async (c) => {
    const client = c.get("client");
    const guildId = c.req.query("guildId");
    const limit = Math.min(Number(c.req.query("limit")) || 10, 100);

    const where = guildId ? { guildId } : {};

    const levels = await client.db.level.findMany({
      where,
      orderBy: { xpTotal: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    return c.json({
      leaderboard: levels.map((level, index) => ({
        rank: index + 1,
        userId: level.userId,
        xpTotal: level.xpTotal,
        xpCurrent: level.xpCurrent,
        level: level.level,
        guildId: level.guildId,
      })),
    });
  },
});
