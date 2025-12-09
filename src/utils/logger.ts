import colors from "ansi-colors";
import type { User } from "discord.js";

import type { AnyCommand } from "../types/command";
import { CommandTypes } from "../types/enums";
import type { AnyEvent } from "../types/event";

const PREFIX = {
  LOAD: colors.cyan.bold("[LOAD]"),
  SUCCESS: colors.green.bold("[SUCCESS]"),
  ERROR: colors.red.bold("[ERROR]"),
  WARN: colors.yellow.bold("[WARN]"),
  INFO: colors.blue.bold("[INFO]"),
} as const;

function timestamp(): string {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", { hour12: false });
  return colors.gray(`[${time}]`);
}

function formatMessage(prefix: string, message: string): string {
  return `${timestamp()} ${prefix} ${message}`;
}

const Logger = {
  load(message: string): void {
    console.log(formatMessage(PREFIX.LOAD, colors.white(message)));
  },

  success(message: string): void {
    console.log(formatMessage(PREFIX.SUCCESS, colors.white(message)));
  },

  error(message: string, error?: Error, panic = false): void {
    const errorMsg = error
      ? `${message}\n${colors.red("  └─")} ${colors.white(error.name)}: ${colors.white(error.message)}`
      : message;

    console.log(formatMessage(PREFIX.ERROR, colors.white(errorMsg)));

    if (error?.stack) {
      const stackLines = error.stack.split("\n").slice(1);
      stackLines.forEach((line) => {
        console.log(colors.gray(`     ${line.trim()}`));
      });
    }

    if (panic) {
      console.log(colors.red.bold("\nExiting due to fatal error...\n"));
      process.exit(1);
    }
  },

  warn(message: string): void {
    console.log(formatMessage(PREFIX.WARN, colors.white(message)));
  },

  info(message: string): void {
    console.log(formatMessage(PREFIX.INFO, colors.white(message)));
  },

  eventRegistered(event: AnyEvent): void {
    const message = `Event "${colors.cyan(event.name)}" registered successfully`;
    Logger.success(message);
  },

  commandRegistered(command: AnyCommand): void {
    const commandType = colors.magenta(`[${CommandTypes[command.type]}]`);
    const message = `Command "${colors.cyan(command.data.name)}" ${commandType} registered successfully`;
    Logger.success(message);
  },

  commandUsed(command: AnyCommand, user: User): void {
    const commandType = colors.magenta(`[${CommandTypes[command.type]}]`);
    const message = `Command "${colors.cyan(command.data.name)}" ${commandType} used by ${colors.yellow(user.username)}`;
    Logger.info(message);
  },
};

export const logError = (error: Error, panic = false): void => {
  Logger.error("An error occurred", error, panic);
};

export const logErrorMessage = (message: string, panic = false): void => {
  Logger.error(message, undefined, panic);
};

export const logWarningMessage = (warning: string): void => {
  Logger.warn(warning);
};

export const logEventRegistered = (event: AnyEvent): void => {
  Logger.eventRegistered(event);
};

export const logCommandRegistered = (command: AnyCommand): void => {
  Logger.commandRegistered(command);
};

export const logCommandUsed = (command: AnyCommand, user: User): void => {
  Logger.commandUsed(command, user);
};

export { Logger };
export default Logger;
