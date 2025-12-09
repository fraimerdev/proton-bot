import { lstat, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import {
  Collection,
  Client as DiscordBotClient,
  REST,
  Routes,
} from "discord.js";

import { startApi } from "../api/app";
import { Config } from "../configs/bot";
import prisma from "../init/database";
import type {
  AnyCommand,
  ApplicationCommand,
  ClientCommands,
} from "../types/command";
import { CommandTypes } from "../types/enums";
import type { AnyEvent } from "../types/event";
import { ENV } from "../utils/env";
import Logger from "../utils/logger";

export class Client<
  Ready extends boolean = boolean,
> extends DiscordBotClient<Ready> {
  protected cwd: string = process.cwd();

  protected isTypescript: boolean = process.argv[1].endsWith(".ts");
  public static readonly sourceFolder = "src";
  public static readonly distFolder = "dist";

  public commands: ClientCommands = {
    messageCommands: new Collection(),
    slashCommands: new Collection(),
    contextMenuCommands: new Collection(),
    buttonCommands: new Collection(),
    stringSelectMenuCommands: new Collection(),
    userSelectMenuCommands: new Collection(),
    mentionableSelectMenuCommands: new Collection(),
    roleSelectMenuCommands: new Collection(),
    channelSelectMenuCommands: new Collection(),

    modalSubmit: new Collection(),
    get applicationCommands() {
      return new Collection<string, ApplicationCommand>([
        ...this.slashCommands,
        ...this.contextMenuCommands,
      ]);
    },
  };

  public config = Config;

  public logger = Logger;

  public db = prisma;

  public env = ENV;

  protected async readDir<T>(dir: string): Promise<T[]> {
    try {
      const baseDir = this.isTypescript
        ? Client.sourceFolder
        : Client.distFolder;
      const path = resolve(this.cwd, baseDir, dir);
      const files = await readdir(path);
      const data: T[] = [];
      for (const file of files) {
        const filePath = resolve(path, file);
        const stat = await lstat(filePath);

        if (stat.isDirectory()) {
          const insideFiles: T[] = await this.readDir(filePath);
          data.push(...insideFiles);
          continue;
        }

        if (!(this.isTypescript ? file.endsWith(".ts") : file.endsWith(".js")))
          continue;

        const importData: Record<string, T | undefined> = await import(
          filePath
        );
        const importedLength = Object.keys(importData).length;

        if (importedLength === 0) {
          Logger.error(
            `File ${filePath} is empty, no exports found`,
            undefined,
            true,
          );
        }

        for (const key in importData) {
          const imported = importData[key] as T;
          data.push(imported);
        }
      }
      return data;
    } catch (error) {
      Logger.error("Failed to read directory", error as Error);
      return [];
    }
  }

  protected async loadEvents(
    modulesDir: string,
    debug = false,
  ): Promise<boolean> {
    try {
      const baseDir = this.isTypescript
        ? Client.sourceFolder
        : Client.distFolder;
      const modulesPath = resolve(this.cwd, baseDir, modulesDir);
      const modules = await readdir(modulesPath);

      let eventsLoaded = 0;

      for (const moduleName of modules) {
        const modulePath = resolve(modulesPath, moduleName);
        const stat = await lstat(modulePath);

        if (!stat.isDirectory()) continue;

        try {
          const events = await this.readDir<AnyEvent>(
            `${modulesDir}/${moduleName}/events`,
          );

          for (const event of events) {
            this.on(event.name, async (...args) => {
              if (!this.isReady() && event.clientIsReady !== false)
                return false;

              try {
                await event.run(this, ...args);
              } catch (error) {
                Logger.error(
                  `Event ${event.name} execution failed`,
                  error as Error,
                );
              }
            });

            if (debug) Logger.eventRegistered(event);
            eventsLoaded++;
          }
        } catch {
          // Module might not have events directory, continue
          continue;
        }
      }

      return eventsLoaded > 0;
    } catch (error) {
      Logger.error("Failed to load events", error as Error);
      return false;
    }
  }

  protected async loadCommands(
    modulesDir: string,
    debug = false,
  ): Promise<boolean> {
    try {
      const baseDir = this.isTypescript
        ? Client.sourceFolder
        : Client.distFolder;
      const modulesPath = resolve(this.cwd, baseDir, modulesDir);
      const modules = await readdir(modulesPath);

      let allCommands: AnyCommand[] = [];

      for (const moduleName of modules) {
        const modulePath = resolve(modulesPath, moduleName);
        const stat = await lstat(modulePath);

        if (!stat.isDirectory()) continue;

        // Load commands from modules/**/commands/.ts
        try {
          const commands = await this.readDir<AnyCommand>(
            `${modulesDir}/${moduleName}/commands`,
          );
          allCommands.push(...commands);
        } catch {
          // Module might not have commands directory, continue
        }

        // Load components from modules/**/components/**/*.ts
        try {
          const components = await this.readDir<AnyCommand>(
            `${modulesDir}/${moduleName}/components`,
          );
          allCommands.push(...components);
        } catch {
          // Module might not have components directory, continue
        }
      }

      if (allCommands.length === 0) return false;

      allCommands = allCommands.sort(
        (a, b) => a.type - b.type || a.data.name.localeCompare(b.data.name),
      );

      for (const command of allCommands) {
        switch (command.type) {
          case CommandTypes.MessageCommand:
            this.commands.messageCommands.set(command.data.name, command);
            break;
          case CommandTypes.SlashCommand:
            this.commands.slashCommands.set(command.data.name, command);
            break;
          case CommandTypes.UserContextMenuCommand:
          case CommandTypes.MessageContextMenuCommand:
            this.commands.contextMenuCommands.set(command.data.name, command);
            break;
          case CommandTypes.ButtonCommand:
            this.commands.buttonCommands.set(command.data.customId, command);
            break;
          case CommandTypes.ModalSubmitCommand:
            this.commands.modalSubmit.set(command.data.customId, command);
            break;
          case CommandTypes.StringSelectMenuCommand:
            this.commands.stringSelectMenuCommands.set(
              command.data.customId,
              command,
            );
            break;
          case CommandTypes.UserSelectMenuCommand:
            this.commands.userSelectMenuCommands.set(
              command.data.customId,
              command,
            );
            break;
          case CommandTypes.RoleSelectMenuCommand:
            this.commands.roleSelectMenuCommands.set(
              command.data.customId,
              command,
            );
            break;
          case CommandTypes.MentionableSelectMenuCommand:
            this.commands.mentionableSelectMenuCommands.set(
              command.data.customId,
              command,
            );
            break;
          case CommandTypes.ChannelSelectMenuCommand:
            this.commands.channelSelectMenuCommands.set(
              command.data.customId,
              command,
            );
            break;
        }

        if (debug) Logger.commandRegistered(command);
      }

      return true;
    } catch (error) {
      Logger.error("Failed to load commands", error as Error);
      return false;
    }
  }

  protected async registerCommands(): Promise<boolean> {
    const commands = this.commands.applicationCommands.map((command) =>
      command.data.toJSON(),
    );

    const rest = new REST().setToken(ENV.BOT_TOKEN);

    try {
      await rest.put(Routes.applicationCommands(ENV.CLIENT_ID), {
        body: commands,
      });
      return true;
    } catch (error) {
      Logger.error("Failed to register commands", error as Error);
      return false;
    }
  }

  public async init(options: StartOptions): Promise<boolean> {
    const loadCommands = await this.loadCommands(
      options.modulesDirName,
      options.debug,
    );

    if (options.debug && loadCommands)
      Logger.success("Commands loaded successfully");

    const loadEvents = await this.loadEvents(
      options.modulesDirName,
      options.debug,
    );

    if (options.debug && loadEvents)
      Logger.success("Events loaded successfully");

    const registeredCommands = options.registerCommands
      ? await this.registerCommands()
      : true;

    if (options.debug && options.registerCommands && registeredCommands)
      Logger.success("Application commands registered successfully");

    const loggedToDiscord = await this.login(options.token)
      .then(() => true)
      .catch(() => false);

    if (options.debug && loggedToDiscord)
      Logger.success("Logged in to Discord");

    const startApiSuccess = await startApi(options.debug);

    const allSuccess =
      loadCommands &&
      loadEvents &&
      registeredCommands &&
      loggedToDiscord &&
      startApiSuccess;

    return allSuccess;
  }
}
