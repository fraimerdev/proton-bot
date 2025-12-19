import { Events } from "discord.js";
import { createEvent } from "../../../utils/create";

export const event = createEvent({
  name: Events.GuildCreate,
  run: async (client, guild) => {
    await client.db.guild.upsert({
      where: { guildId: guild.id },
      update: {},
      create: { guildId: guild.id },
    });
    
    return true;
  },
});
