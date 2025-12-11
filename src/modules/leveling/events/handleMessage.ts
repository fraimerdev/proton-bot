import {
  Events,
  PermissionsBitField,
  type Role,
  type TextChannel,
} from "discord.js";
import type { Level, LevelReward } from "#generated/prisma";
import { checkModuleEnabled } from "../../../utils/checkModuleEnabled";
import { createEvent } from "../../../utils/create";
import Logger from "../../../utils/logger";
import { RateLimiter } from "../../../utils/rateLimiter";
import { highestRole, parser } from "../../../utils/utils";
import { getTargetXp, randXp, totalXp } from "../functions/xp";

export const event = createEvent({
  name: Events.MessageCreate,
  run: async (client, message) => {
    if (
      message.author.bot ||
      !message.member ||
      !message.guild ||
      !checkModuleEnabled(message.guild.id, "leveling")
    )
      return false;

    const levelling = await client.db.levelling.upsert({
      where: { guildId: message.guild.id },
      update: {},
      create: { guildId: message.guild.id },
      select: {
        xpRate: true,
        silent: true,
        stack: true,
        levelUpChannel: true,
        levelUpMessage: true,
        rewards: true,
        ignoredRoles: true,
        ignoredChannels: true,
        multipliers: true,
      },
    });

    if (levelling.ignoredRoles) {
      if (
        levelling.ignoredRoles.find((r: string) =>
          message.member?.roles.cache.has(r),
        )
      )
        return false;
    }

    if (levelling.ignoredChannels) {
      if (levelling.ignoredChannels.includes(message.channel.id)) return false;
    }

    const messageRatelimiter = new RateLimiter({
      time: 60 * 1000,
      maxPoints: 1,
      keyPrefix: "leveling_message",
    });

    if (
      !(await messageRatelimiter.consume(message.guild.id + message.author.id))
    )
      return false;

    const query = {
      guildId: message.guild.id,
      userId: message.author.id,
    };

    let levelData: Level | null = null;

    try {
      levelData = await client.db.level.findUnique({
        where: { guildId_userId: query },
      });
    } catch (err) {
      Logger.error(
        `levels: failed to retrive level data for user: ${message.author.id} in guild: ${message.guild.id}` +
          err,
      );
      return false;
    }

    const multipliers = levelling.multipliers;

    let multiplier = 1;
    if (multipliers && multipliers.length > 0) {
      for (const m of multipliers) {
        if (m.type === "role" && message.member.roles.cache.has(m.id)) {
          multiplier *= m.multiplier;
        }
        if (m.type === "channel" && message.channel.id === m.id) {
          multiplier *= m.multiplier;
        }
      }
    }

    const toAddXP = randXp() * (levelling.xpRate || 1) * multiplier;
    if (!levelData) {
      client.db.level
        .create({
          data: {
            guildId: message.guild.id,
            userId: message.author.id,
            level: 0,
            xpTotal: toAddXP,
            xpCurrent: toAddXP,
            xpRequired: 100,
          },
        })
        .catch((err) => {
          Logger.error(
            `levels: failed to create new level for user: ${message.author.id} in guild: ${message.guild?.id}`,
            err,
          );
        });
      return true;
    }

    const newTotalXP = totalXp(levelData.level) + levelData.xpCurrent + toAddXP;

    if (levelData.xpCurrent + toAddXP > levelData.xpRequired) {
      const newCurrentXP = toAddXP + levelData.xpCurrent - levelData.xpRequired;
      const newLevel = levelData.level + 1;

      await client.db.level
        .update({
          where: { guildId_userId: query },
          data: {
            level: newLevel,
            xpTotal: newTotalXP,
            xpCurrent: newCurrentXP,
            xpRequired: getTargetXp(newLevel),
          },
        })
        .catch((err) => {
          Logger.error(
            `levels: failed to level-up user: ${message.author.id} in guild: ${message.guild?.id}`,
            err,
          );
        });

      const rewardslevelling = levelling.rewards;

      let rewardedRole: Role | undefined;

      if (rewardslevelling && rewardslevelling.length > 0) {
        const selfMember = message.guild.members.me;
        if (!selfMember) {
          Logger.warn(
            `levels: couldn't retrive self member in guild: ${message.guild.id}`,
          );
          return true;
        }

        if (selfMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
          const selfHighestRole = highestRole(selfMember, message.guild);

          const rewards: LevelReward[] = [];

          let roles = Array.from(message.member.roles.cache.keys());

          if (rewardslevelling) {
            for (let x = 0; x < rewardslevelling.length; x++) {
              const reward = rewardslevelling[x];
              if (!reward) continue;
              const guildRole = message.guild.roles.cache.get(reward.roleId);
              if (
                guildRole &&
                selfHighestRole &&
                guildRole.position < selfHighestRole.position
              ) {
                rewards.push(reward);
              }
            }
          }

          if (levelling.stack) {
            const addRole = rewards.find((r) => r.level === newLevel);

            if (addRole) {
              roles.push(addRole.roleId);
              rewardedRole = message.guild.roles.cache.get(addRole.roleId);
            }

            message.member.roles.set(roles).catch((err) => {
              Logger.warn(
                `levels: failed to modify user roles, stack: true, guild id: ${message.guild?.id} user: ${message.author.id}` +
                  err,
              );
            });
          } else {
            roles = roles.filter(
              (r) => r && !rewards.find((rw) => rw.roleId === r),
            );

            const addRole = rewardslevelling
              .sort((a, b) => b.level - a.level)
              .find((r) => r.level <= newLevel);

            if (addRole) {
              roles.push(addRole.roleId);
              rewardedRole = message.guild.roles.cache.get(addRole.roleId);
            }

            message.member.roles.set(roles).catch((err) => {
              Logger.warn(
                `levels: failed to modify user roles, stack: false, guild id: ${message.guild?.id} user: ${message.author.id}` +
                  err,
              );
            });
          }
        }
      }

      if (levelling.silent) {
        return true;
      }

      const reward = rewardedRole
        ? {
            id: rewardedRole.id,
            name: rewardedRole.name,
            mention: `<@&${rewardedRole.id}>`,
          }
        : null;

      const tags = [
        [
          "user",
          {
            id: message.author.id,
            mention: message.author.toString(),
            username: message.author.username,
            avatarURL: message.author.displayAvatarURL({ size: 2048 }),
          },
        ],
        [
          "server",
          {
            id: message.guild.id,
            name: message.guild.name,
            iconURL: message.guild.iconURL({ size: 2048 }),
            ownerID: message.guild.ownerId,
            memberCount: message.guild.memberCount,
          },
        ],
        ["reward", reward],
        ["level", newLevel],
        ["oldLevel", newLevel - 1],
      ];

      const parsedMessage = parser.parse(
        levelling.levelUpMessage ||
          "GGs {user:mention}! You have leveled up to **Level {level}**.",
        tags,
      );

      const channel = message.guild.channels.cache.get(
        levelling.levelUpChannel || message.channel.id,
      ) as TextChannel;

      if (!channel) return true;

      const botMember = message.guild.members.me;
      if (!botMember) return true;

      const chPerms = channel.permissionsFor(botMember);
      if (
        !chPerms ||
        !chPerms.has([
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
        ])
      )
        return true;

      if (parsedMessage?.length) {
        channel
          .send({
            content: parsedMessage.toString(),
            allowedMentions: {
              parse: ["users"],
            },
          })
          .catch((err) =>
            Logger.warn(`levels: failed to create message: ${err}`),
          );
      }
    } else {
      await client.db.level
        .update({
          where: { guildId_userId: query },
          data: {
            xpCurrent: { increment: toAddXP },
            xpTotal: { set: newTotalXP },
          },
        })
        .catch((err) => {
          Logger.error(
            `levels: failed to update user xp, guild id: ${message.guild?.id}, user id: ${message.author.id}`,
            err,
          );
        });
    }

    return true;
  },
});
