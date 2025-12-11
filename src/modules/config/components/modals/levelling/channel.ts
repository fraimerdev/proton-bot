import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { ComponentCommandBuilder } from "../../../../../base/componentCommandBuilder";
import prisma from "../../../../../init/database";
import { CommandTypes } from "../../../../../types/enums";
import { createCommand } from "../../../../../utils/create";

export const command = createCommand({
  type: CommandTypes.ModalSubmitCommand,
  data: new ComponentCommandBuilder().setName("levelling_channel_submit").setCustomId(/^levelling_channel_submit$/),

  execute: async (_client, interaction) => {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This command can only be used in a server!",
        ephemeral: true,
      });
      return false;
    }

    const channel = interaction.fields
      .getSelectedChannels("levelling_channel_id", true, [ChannelType.GuildText, ChannelType.GuildAnnouncement])
      .at(0)?.id;

    if (!channel) {
      await interaction.reply({
        content: "Invalid channel ID. Please provide a valid text channel ID.",
        ephemeral: true,
      });
      return false;
    }

    await prisma.levelling.upsert({
      where: { guildId: interaction.guildId },
      create: {
        guildId: interaction.guildId,
        levelUpChannel: channel,
      },
      update: {
        levelUpChannel: channel,
      },
    });

    const levellingConfig = await prisma.levelling.findUnique({
      where: { guildId: interaction.guildId },
    });

    if (!levellingConfig) {
      await interaction.reply({
        content: "Failed to update configuration. Please try again.",
        ephemeral: true,
      });
      return false;
    }

    const headerText = new TextDisplayBuilder().setContent(
      "# Leveling Configuration\nConfigure your server's leveling system settings.",
    );

    const levelUpChannelSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## Level Up Channel\n${levellingConfig.levelUpChannel ? `Currently set to <#${levellingConfig.levelUpChannel}>` : "No channel set - level up messages will be sent in the same channel."}`,
        ),
      )
      .setButtonAccessory(
        new ButtonBuilder().setCustomId("leveling_set_channel").setLabel("Set Channel").setStyle(ButtonStyle.Primary),
      );

    const silentSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## Silent Mode\n${levellingConfig.silent ? "Level up messages are currently disabled." : "Level up messages are currently enabled."}`,
        ),
      )
      .setButtonAccessory(
        new ButtonBuilder()
          .setCustomId("leveling_toggle_silent")
          .setLabel(levellingConfig.silent ? "Enable Messages" : "Disable Messages")
          .setStyle(levellingConfig.silent ? ButtonStyle.Success : ButtonStyle.Danger),
      );

    const stackSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## Stack Mode\n${levellingConfig.stack ? "Multiple level ups are announced in a single message." : "Each level up is announced separately."}`,
        ),
      )
      .setButtonAccessory(
        new ButtonBuilder()
          .setCustomId("leveling_toggle_stack")
          .setLabel(levellingConfig.stack ? "Disable Stacking" : "Enable Stacking")
          .setStyle(levellingConfig.stack ? ButtonStyle.Danger : ButtonStyle.Success),
      );

    const xpRateSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## XP Rate Multiplier\nCurrent multiplier: ${levellingConfig.xpRate ? `${levellingConfig.xpRate}x` : "1.0x (default)"}`,
        ),
      )
      .setButtonAccessory(
        new ButtonBuilder().setCustomId("leveling_set_xp_rate").setLabel("Set Rate").setStyle(ButtonStyle.Secondary),
      );

    const messageSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## Level Up Message\nCustomize the message sent when users level up.\nCurrent: \`${levellingConfig.levelUpMessage}\``,
        ),
      )
      .setButtonAccessory(
        new ButtonBuilder()
          .setCustomId("leveling_set_message")
          .setLabel("Edit Message")
          .setStyle(ButtonStyle.Secondary),
      );

    const separator = new SeparatorBuilder();

    const backText = new TextDisplayBuilder().setContent("Return to the main configuration menu:");

    const backButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("config_back_to_main")
        .setLabel("Back to Main Menu")
        .setStyle(ButtonStyle.Secondary),
    );

    const container = new ContainerBuilder()
      .setAccentColor(0x317ff5)
      .addTextDisplayComponents(headerText)
      .addSeparatorComponents(separator)
      .addSectionComponents(levelUpChannelSection, silentSection, stackSection, xpRateSection, messageSection)
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(backText)
      .addActionRowComponents(backButton);

    await interaction.message?.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    await interaction.reply({
      content: `Level up channel has been set to <#${channel}>.`,
      flags: MessageFlags.Ephemeral,
    });

    return true;
  },
});
