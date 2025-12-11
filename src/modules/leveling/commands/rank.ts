import {
  type GuildMember,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { CommandTypes } from "../../../types/enums";
import { checkModuleEnabled } from "../../../utils/checkModuleEnabled";
import { createCommand } from "../../../utils/create";
import Logger from "../../../utils/logger";
import { getRankCard } from "../functions/getRankCard";

export const command = createCommand({
  type: CommandTypes.SlashCommand,
  guildOnly: true,
  cooldown: 15000,
  cooldownMaxUses: 3,
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Check your rank and level in the server."),

  execute: async (client, interaction) => {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: [MessageFlags.Ephemeral],
      });
      return false;
    }

    if (!(await checkModuleEnabled(guild.id, "leveling"))) {
      await interaction.reply({
        content:
          "The leveling module is not enabled on this server. Please contact an administrator to enable it.",
        flags: [MessageFlags.Ephemeral],
      });
      return false;
    }

    const userOpt = interaction.options.getUser("user");
    const member = (
      userOpt
        ? interaction.guild.members.cache.get(userOpt.id)
        : interaction.member
    ) as GuildMember;

    if (!member) {
      await interaction.reply({
        content: "Couldn't retrieve member data, please try again later...",
        flags: [MessageFlags.Ephemeral],
      });
      return false;
    }

    if (member.user.bot) {
      await interaction.reply({ content: "Bots don't have a rank." });
      return false;
    }

    const levelData = await client.db.level.findUnique({
      where: {
        guildId_userId: {
          guildId: guild.id,
          userId: member.user.id,
        },
      },
    });

    if (!levelData) {
      const content =
        member.user.id === interaction.user.id
          ? "You don't have a level."
          : "That user doesn't have a level.";

      await interaction
        .reply({ content })
        .catch((err) =>
          Logger.warn(`command: rank: failed to send interaction: ${err}`),
        );

      return false;
    }

    const rankCard = await getRankCard(member, levelData);

    await interaction
      .reply({
        files: rankCard,
      })
      .catch((err) =>
        Logger.warn(`command: rank: failed to send interaction: ${err}`),
      );

    return true;
  },
});
