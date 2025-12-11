import { InteractionContextType, SlashCommandBuilder } from "discord.js";

import { CommandTypes } from "../../../types/enums";
import { createCommand } from "../../../utils/create";

export const command = createCommand({
  type: CommandTypes.SlashCommand,
  cooldown: 5000,
  cooldownMaxUses: 3,
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!")
    .addStringOption((option) =>
      option
        .setName("input")
        .setDescription("The input to echo back")
        .setRequired(false),
    )
    .setContexts(InteractionContextType.Guild),

  execute: async (_client, interaction) => {
    const str = interaction.options.getString("input");
    await interaction.reply(str ? `Pong! ${str}` : "Pong!");
    return true;
  },
});
