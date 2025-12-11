import "./utils/prototype";

import { ActivityType, AllowedMentionsTypes, GatewayIntentBits, Partials, PresenceUpdateStatus } from "discord.js";

import { Client } from "./base/client";
import { ENV } from "./utils/env";
import Logger from "./utils/logger";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
  allowedMentions: {
    parse: [AllowedMentionsTypes.Role, AllowedMentionsTypes.User],
    repliedUser: true,
  },
  failIfNotExists: false,
  presence: {
    activities: [
      {
        name: "development",
        type: ActivityType.Watching,
      },
    ],
    status: PresenceUpdateStatus.DoNotDisturb,
  },
});

client.init({
  token: ENV.BOT_TOKEN,
  modulesDirName: "modules",
  registerCommands: true,
  debug: true,
});

process.on("unhandledRejection", (error: Error) => {
  Logger.error("Unhandled promise rejection", error);
});

process.on("uncaughtException", (error: Error) => {
  Logger.error("Uncaught exception", error);
});

process.on("SIGINT", async () => {
  Logger.warn("Shutting down...");
  process.exit(0);
});
