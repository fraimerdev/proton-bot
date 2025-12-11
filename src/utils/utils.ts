import type { Guild, GuildMember, PartialEmoji, Role } from "discord.js";

export { Parser } from "./parser";
export { default as parser } from "./parser";
export { default as DataStore } from "./dataStore";

const customEmojiRegex = /<a?:.+?:\d{16,18}>/g;
const unicodeRegex = /\p{Extended_Pictographic}/u;
const durationRegex = /(\d+)\s*(year|month|week|day|hour|minute|y|m|w|d|h|min)/g;
const argsRegex = / (?=(?:[^"]|"[^"]*")*$)/;

export const highestRole = (member: GuildMember, guild: Guild) => {
  const roles = member.roles.cache.map((r) => guild.roles.cache.get(r.id)).filter((el) => el !== undefined) as Role[];
  return roles.sort((a, b) => b.position - a.position)[0] || guild.roles.cache.get(guild.id);
};

export const countEmojis = (string = "") => {
  let total = 0;
  const customMatch = string.match(customEmojiRegex);
  if (customMatch && customMatch.length > 0) {
    total += customMatch.length;
  }
  const unicodeMatch = string.match(unicodeRegex);
  if (unicodeMatch && unicodeMatch.length) {
    total += unicodeMatch.length;
  }
  return total;
};

export const stringifyEmoji = (emoji: PartialEmoji) => {
  if (emoji.id) {
    if (emoji.animated === false) {
      return `<:${emoji.name}:${emoji.id}>`;
    } else {
      return `<a:${emoji.name}:${emoji.id}>`;
    }
  } else {
    return emoji.name;
  }
};

export const parseDuration = (val: string) => {
  const matches = val.matchAll(durationRegex);
  let duration = 0;
  let iterations = 0;
  let input;
  for (const match of matches) {
    if (!input) {
      input = match.input;
    }
    if (iterations === 5) {
      return { duration: duration, match: [input] };
    }
    iterations++;
    switch (match[2]) {
      case "year":
      case "y": {
        duration += +match[1] * 3.154e10;
        break;
      }
      case "month": {
        duration += +match[1] * 2.628e9;
        break;
      }
      case "week":
      case "w": {
        duration += +match[1] * 6.048e8;
        break;
      }
      case "day":
      case "d": {
        duration += +match[1] * 8.64e7;
        break;
      }
      case "hour":
      case "h": {
        duration += +match[1] * 3.6e6;
        break;
      }
      case "minute":
      case "min":
      case "m": {
        duration += +match[1] * 60000;
        break;
      }
    }
    if (duration > 1.577e11) {
      return { duration: 1.577e11, match: match };
    }
  }
  return { duration: duration, match: [input] };
};

export const sensorWord = (str: string) => {
  if (str.length === 1) {
    return str;
  }
  const start = str[0];
  const end = str[str.length - 1];
  if (str.length === 2) {
    return `${str[0]}*`;
  }
  return `${start}${"*".repeat(str.length - 2)}${end}`;
};

export const abbrev = (n: number) => {
  //https://stackoverflow.com/a/55987414
  if (n < 1e3) {
    return `${n}`;
  }
  if (n >= 1e3 && n < 1e6) {
    return +(n / 1e3).toFixed(1) + "K";
  }
  if (n >= 1e6 && n < 1e9) {
    return +(n / 1e6).toFixed(1) + "M";
  }
  if (n >= 1e9 && n < 1e12) {
    return +(n / 1e9).toFixed(1) + "B";
  }
  if (n >= 1e12) {
    return +(n / 1e12).toFixed(1) + "T";
  }
  return `${n}`;
};

export const splitArgs = (string: string) => {
  return string.split(argsRegex).map((arg) => {
    if (arg.startsWith('"') && arg.endsWith('"')) {
      return arg.slice(1, arg.length - 1);
    }
    return arg;
  });
};

export const genComponentRoleID = () => {
  const IDlen = 10;
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < IDlen; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `cr_${out}`;
};

export const generateId = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
};
