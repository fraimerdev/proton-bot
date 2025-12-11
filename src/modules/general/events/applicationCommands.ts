import type { ChatInputCommandInteraction, ContextMenuCommandInteraction } from "discord.js";
import { Events, MessageFlags } from "discord.js";

import type { Client } from "../../../base/client";
import { createEvent } from "../../../utils/create";
import Logger from "../../../utils/logger";
import { RateLimiter } from "../../../utils/rateLimiter";

// Global rate limiters map for commands
const commandLimiters = new Map<string, RateLimiter>();

export const event = createEvent({
  name: Events.InteractionCreate,
  run: async (client, interaction) => {
    if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) {
      return false;
    }

    const commandsCollection = interaction.isChatInputCommand()
      ? client.commands.slashCommands
      : client.commands.contextMenuCommands;

    const command = commandsCollection.get(interaction.commandName);

    if (!command) return false;

    if (command.devOnly && !client.config.devsIds.includes(interaction.user.id)) {
      await interaction.reply({
        content: "You don't have permission to use this command.",
        ephemeral: true,
      });

      return false;
    }

    if (command.guildOnly && !interaction.inGuild()) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });

      return false;
    }

    // Handle rate limiting
    if (command.cooldown) {
      const cooldownKey = `${interaction.commandName}`;
      let limiter = commandLimiters.get(cooldownKey);

      if (!limiter) {
        limiter = new RateLimiter({
          time: command.cooldown,
          maxPoints: command.cooldownMaxUses || 1,
          keyPrefix: `cmd:${interaction.commandName}`,
        });
        commandLimiters.set(cooldownKey, limiter);
      }

      const userKey = interaction.user.id;
      const allowed = await limiter.check(userKey);

      if (!allowed) {
        const remaining = await limiter.getTimeUntilReset(userKey);
        const seconds = Math.ceil(remaining / 1000);
        await interaction.reply({
          content: `⏱️ You're on cooldown! Please wait ${seconds} second${seconds !== 1 ? "s" : ""} before using this command again.`,
          ephemeral: true,
        });
        return false;
      }
    }

    if (command.defer)
      await interaction.deferReply({
        flags: command.ephemeral ? MessageFlags.Ephemeral : undefined,
      });

    Logger.commandUsed(command, interaction.user);

    try {
      await (
        command.execute as (
          client: Client,
          interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
        ) => Promise<boolean>
      )(client, interaction);
    } catch (error) {
      Logger.error("Command execution failed", error as Error);

      const errorMessage = "An error occurred while executing this command.";

      if (command.defer) {
        await interaction.editReply({ content: errorMessage }).catch(() => null);
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => null);
      }

      return false;
    }

    return true;
  },
});
