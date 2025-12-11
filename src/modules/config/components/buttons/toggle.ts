import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { ComponentCommandBuilder } from "../../../../base/componentCommandBuilder";
import prisma from "../../../../init/database";
import { CommandTypes } from "../../../../types/enums";
import { createCommand } from "../../../../utils/create";

export const command = createCommand({
  type: CommandTypes.ButtonCommand,
  data: new ComponentCommandBuilder()
    .setName("config-toggle")
    .setCustomId(/^config_toggle_(automod|leveling|logging|moderation|starboard|tickets)$/),

  execute: async (_client, interaction, commandIdData) => {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This command can only be used in a server!",
        ephemeral: true,
      });
      return false;
    }

    // Ensure guild exists first
    await prisma.guild.upsert({
      where: { guildId: interaction.guildId },
      create: { guildId: interaction.guildId },
      update: {},
    });

    const moduleName = commandIdData[1] as keyof Omit<
      Awaited<ReturnType<typeof prisma.module.findUnique>>,
      "id" | "guildId" | "guild"
    >;

    // Get or create the module configuration
    let moduleConfig = await prisma.module.findUnique({
      where: { guildId: interaction.guildId },
    });

    if (!moduleConfig) {
      moduleConfig = await prisma.module.create({
        data: { guildId: interaction.guildId },
      });
    }

    // Toggle the module
    const currentValue = moduleConfig[moduleName];
    const newValue = !currentValue;

    await prisma.module.update({
      where: { guildId: interaction.guildId },
      data: { [moduleName]: newValue },
    });

    // Update the module config object for display
    moduleConfig[moduleName] = newValue;

    // Header text
    const headerText = new TextDisplayBuilder().setContent(
      "# Server Configuration\nToggle modules on or off using the buttons below.",
    );

    // Automod section
    const automodSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## Automod\nAutomatically moderate your server with customizable rules and filters.`,
        ),
      )
      .setButtonAccessory(
        new ButtonBuilder()
          .setCustomId("config_toggle_automod")
          .setLabel(moduleConfig.automod ? "Disable" : "Enable")
          .setStyle(moduleConfig.automod ? ButtonStyle.Danger : ButtonStyle.Success),
      );

    // Leveling section
    const levelingSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## Leveling\nReward active members with XP and levels based on their participation.`,
        ),
      )
      .setButtonAccessory(
        new ButtonBuilder()
          .setCustomId("config_toggle_leveling")
          .setLabel(moduleConfig.leveling ? "Disable" : "Enable")
          .setStyle(moduleConfig.leveling ? ButtonStyle.Danger : ButtonStyle.Success),
      );

    // Logging section
    const loggingSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## Logging\nTrack server events and changes with detailed logging channels.`,
        ),
      )
      .setButtonAccessory(
        new ButtonBuilder()
          .setCustomId("config_toggle_logging")
          .setLabel(moduleConfig.logging ? "Disable" : "Enable")
          .setStyle(moduleConfig.logging ? ButtonStyle.Danger : ButtonStyle.Success),
      );

    // Moderation section
    const moderationSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## Moderation\nManage members with powerful moderation tools including warnings, bans, and kicks.`,
        ),
      )
      .setButtonAccessory(
        new ButtonBuilder()
          .setCustomId("config_toggle_moderation")
          .setLabel(moduleConfig.moderation ? "Disable" : "Enable")
          .setStyle(moduleConfig.moderation ? ButtonStyle.Danger : ButtonStyle.Success),
      );

    // Starboard section
    const starboardSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## Starboard\nHighlight popular messages by allowing members to star their favorites.`,
        ),
      )
      .setButtonAccessory(
        new ButtonBuilder()
          .setCustomId("config_toggle_starboard")
          .setLabel(moduleConfig.starboard ? "Disable" : "Enable")
          .setStyle(moduleConfig.starboard ? ButtonStyle.Danger : ButtonStyle.Success),
      );

    // Tickets section
    const ticketsSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## Tickets\nProvide support to members through private ticket channels.`),
      )
      .setButtonAccessory(
        new ButtonBuilder()
          .setCustomId("config_toggle_tickets")
          .setLabel(moduleConfig.tickets ? "Disable" : "Enable")
          .setStyle(moduleConfig.tickets ? ButtonStyle.Danger : ButtonStyle.Success),
      );

    // Separator
    const separator = new SeparatorBuilder();

    // Select menu text
    const selectText = new TextDisplayBuilder().setContent(
      "### Advanced Configuration\nSelect a module to configure its settings:",
    );

    // Select menu action row
    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("config_select_module")
        .setPlaceholder("Select a module to configure")
        .addOptions(
          {
            label: "Automod Settings",
            description: "Configure automod rules and settings",
            value: "automod",
          },
          {
            label: "Leveling Settings",
            description: "Configure leveling system",
            value: "leveling",
          },
          {
            label: "Logging Settings",
            description: "Configure logging channels and events",
            value: "logging",
          },
          {
            label: "Moderation Settings",
            description: "Configure moderation tools",
            value: "moderation",
          },
          {
            label: "Starboard Settings",
            description: "Configure starboard channel and reactions",
            value: "starboard",
          },
          {
            label: "Tickets Settings",
            description: "Configure ticket system",
            value: "tickets",
          },
        ),
    );

    const container = new ContainerBuilder()
      .setAccentColor(0x317ff5)
      .addTextDisplayComponents(headerText)
      .addSeparatorComponents(separator)
      .addSectionComponents(
        automodSection,
        levelingSection,
        loggingSection,
        moderationSection,
        starboardSection,
        ticketsSection,
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(selectText)
      .addActionRowComponents(selectRow);

    await interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    return true;
  },
});
