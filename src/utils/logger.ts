import colors from "ansi-colors";
import type { User } from "discord.js";

import type { AnyCommand } from "../types/command";
import { CommandTypes } from "../types/enums";
import type { AnyEvent } from "../types/event";

export function logError(error: Error, panic = false): void {
  console.log(
    `${colors.red.underline.bold("Error:")} ${colors.green.bold(
      error.name,
    )} ${colors.red.bold(error.message)}\n${colors.white(error.stack || "no error stack")}`,
  );
  if (panic) process.exit(1);
}

export function logErrorMessage(message: string, panic = false): void {
  console.log(`${colors.red.underline.bold("Error:")} ${colors.red.bold(message)}\n`);
  if (panic) process.exit(1);
}

export function logWarningMessage(warning: string): void {
  console.log(`${colors.yellow.underline.bold("Warning:")} ${colors.red.bold(warning)}\n`);
}

export function logEventRegistered(event: AnyEvent): void {
  console.log(
    `${colors.blue.underline.bold("Event:")} ${colors.red.bold(event.name)} ${colors.magenta("has been registered successfully")}\n`,
  );
}

export function logCommandRegistered(command: AnyCommand): void {
  console.log(
    `${colors.green.underline.bold.bold("Command:")} ${colors.red.bold(
      command.data.name,
    )} ${colors.blue(CommandTypes[command.type])} ${colors.magenta("has been registered successfully")}\n`,
  );
}

export function logCommandUsed(command: AnyCommand, user: User): void {
  const message = `- ${colors.greenBright(command.data.name)} ${colors.red(
    CommandTypes[command.type],
  )} was used by ${colors.greenBright(user.username)}`;
  console.log(message);
}

// Export as namespace object for backward compatibility
export const Logger = {
  logError,
  logErrorMessage,
  logWarningMessage,
  logEventRegistered,
  logCommandRegistered,
  logCommandUsed,
};
