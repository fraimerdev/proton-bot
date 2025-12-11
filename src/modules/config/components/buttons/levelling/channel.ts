import { ChannelSelectMenuBuilder, ChannelType, LabelBuilder, ModalBuilder } from "discord.js";
import { ComponentCommandBuilder } from "../../../../../base/componentCommandBuilder";
import { CommandTypes } from "../../../../../types/enums";
import { createCommand } from "../../../../../utils/create";

export const command = createCommand({
  type: CommandTypes.ButtonCommand,
  data: new ComponentCommandBuilder().setName("config-levelling-channel").setCustomId(/^leveling_set_channel$/),

  execute: async (_client, interaction, _commandIdData) => {
    const modal = new ModalBuilder().setCustomId("levelling_channel_submit").setTitle("Set Levelling Channel");

    const selectChannel = new LabelBuilder()
      .setLabel("Channel")
      .setDescription("Select a channel for level up messages")
      .setChannelSelectMenuComponent(
        new ChannelSelectMenuBuilder()
          .setCustomId("levelling_channel_id")
          .setPlaceholder("Select a channel")
          .setRequired(true)
          .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
      );

    modal.addLabelComponents(selectChannel);

    await interaction.showModal(modal);

    return true;
  },
});
