import { Events } from "discord.js";

import { createEvent } from "../../../utils/create";
import { RateLimiter } from "../../../utils/rateLimiter";

// Global rate limiters map for commands
const commandLimiters = new Map<string, RateLimiter>();

export const event = createEvent({
  name: Events.MessageCreate,
  run: async (client, message) => {
    if (message.partial) await message.fetch().catch(() => null);
    if (message.author.bot) return false;

    const prefixRegex = RegExp(`^(<@!?${client.user.id}> ?|${client.config.prefix})`);

    if (!prefixRegex.test(message.content)) return false;

    const pureContent = message.content.trim().replace(prefixRegex, "");

    const [commandName] = pureContent.split(/(?: |\n)+/);

    const args = pureContent.slice(commandName.length).trim().split(/ +/);

    const command = client.commands.messageCommands.get(commandName);

    if (!command) return false;
    if (command.devOnly && !client.config.devsIds.includes(message.author.id)) return false;

    // Handle rate limiting
    if (command.cooldown) {
      const cooldownKey = `${commandName}`;
      let limiter = commandLimiters.get(cooldownKey);

      if (!limiter) {
        limiter = new RateLimiter({
          time: command.cooldown,
          maxPoints: command.cooldownMaxUses || 1,
          keyPrefix: `cmd:${commandName}`,
        });
        commandLimiters.set(cooldownKey, limiter);
      }

      const userKey = message.author.id;
      const allowed = await limiter.check(userKey);

      if (!allowed) {
        const remaining = await limiter.getTimeUntilReset(userKey);
        const seconds = Math.ceil(remaining / 1000);
        await message
          .reply({
            content: `⏱️ You're on cooldown! Please wait ${seconds} second${seconds !== 1 ? "s" : ""} before using this command again.`,
          })
          .catch(() => null);
        return false;
      }
    }

    client.logger.logCommandUsed(command, message.author);

    try {
      await command.execute(client, message, args);
    } catch (error) {
      client.logger.logError(error as Error);
      return false;
    }

    return true;
  },
});
