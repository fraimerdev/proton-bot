import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  Collection,
  MentionableSelectMenuInteraction,
  ModalSubmitInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
} from "discord.js";
import { Events, MessageFlags } from "discord.js";

import type { Client } from "../../../base/client";
import type { ComponentCommand } from "../../../types/command";
import { createEvent } from "../../../utils/create";
import Logger from "../../../utils/logger";

export const event = createEvent({
  name: Events.InteractionCreate,
  run: async (client, interaction) => {
    let commandsCollection: Collection<RegExp, ComponentCommand> | null = null;

    if (interaction.isButton())
      commandsCollection = client.commands.buttonCommands;
    else if (interaction.isModalSubmit())
      commandsCollection = client.commands.modalSubmit;
    else if (interaction.isStringSelectMenu())
      commandsCollection = client.commands.stringSelectMenuCommands;
    else if (interaction.isUserSelectMenu())
      commandsCollection = client.commands.userSelectMenuCommands;
    else if (interaction.isRoleSelectMenu())
      commandsCollection = client.commands.roleSelectMenuCommands;
    else if (interaction.isMentionableSelectMenu())
      commandsCollection = client.commands.mentionableSelectMenuCommands;
    else if (interaction.isChannelSelectMenu())
      commandsCollection = client.commands.channelSelectMenuCommands;
    else return false;

    if (!commandsCollection) return false;

    const command = commandsCollection.find((cmd) =>
      cmd.data.customId.test(interaction.customId),
    );

    if (!command) return false;

    if (
      command.devOnly &&
      !client.config.devsIds.includes(interaction.user.id)
    ) {
      await interaction.reply({
        content: "You don't have permission to use this command.",
        ephemeral: true,
      });
      return false;
    }

    if (command.defer)
      await interaction.deferReply({
        flags: command.ephemeral ? MessageFlags.Ephemeral : undefined,
      });

    const commandIdData = command.data.customId.exec(interaction.customId);

    if (!commandIdData) return false;

    if (command.data.needReset) command.data.reset();

    try {
      // Type assertion needed due to union type limitations
      await (
        command.execute as (
          client: Client,
          interaction:
            | ButtonInteraction
            | ModalSubmitInteraction
            | StringSelectMenuInteraction
            | UserSelectMenuInteraction
            | RoleSelectMenuInteraction
            | MentionableSelectMenuInteraction
            | ChannelSelectMenuInteraction,
          commandIdData: RegExpExecArray,
        ) => Promise<boolean>
      )(client, interaction, commandIdData);
    } catch (error) {
      Logger.error("Component command execution failed", error as Error);

      const errorMessage = "An error occurred while executing this command.";

      if (command.defer) {
        await interaction
          .editReply({ content: errorMessage })
          .catch(() => null);
      } else {
        await interaction
          .reply({ content: errorMessage, ephemeral: true })
          .catch(() => null);
      }

      return false;
    }

    return true;
  },
});
