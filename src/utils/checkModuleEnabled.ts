import prisma from "../init/database";
import type { Module } from "../types/module";

export async function checkModuleEnabled(
  guildId: string,
  module: Module,
): Promise<boolean> {
  try {
    const moduleConfig = await prisma.module.upsert({
      where: { guildId },
      update: {},
      create: { guildId },
      select: { [module]: true },
    });

    return moduleConfig[module];
  } catch (error) {
    console.error(
      `Error checking if module ${module} is enabled for guild ${guildId}:`,
      error,
    );
    return false;
  }
}
