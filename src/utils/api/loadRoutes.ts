import { resolve } from "node:path";
import type { AnyRoute } from "../../types/route";
import Logger from "../logger";
import { lstat, readdir } from "node:fs/promises";

const isTypescript = process.argv[1].endsWith(".ts");
const cwd = process.cwd();
const sourceFolder = "src";
const distFolder = "dist";

/**
 * Recursively reads a directory and imports all route files.
 */
async function readRouteDir(dir: string): Promise<{ route: AnyRoute; filePath: string }[]> {
  try {
    const baseDir = isTypescript ? sourceFolder : distFolder;
    const path = resolve(cwd, baseDir, dir);
    const files = await readdir(path);
    const data: { route: AnyRoute; filePath: string }[] = [];

    for (const file of files) {
      const filePath = resolve(path, file);
      const stat = await lstat(filePath);

      if (stat.isDirectory()) {
        const insideFiles = await readRouteDir(`${dir}/${file}`);
        data.push(...insideFiles);
        continue;
      }

      const ext = isTypescript ? ".ts" : ".js";
      if (!file.endsWith(ext)) continue;

      const importData: Record<string, AnyRoute | undefined> = await import(filePath);

      for (const key in importData) {
        const imported = importData[key];
        if (imported && typeof imported === "object" && "method" in imported && "handler" in imported) {
          // Calculate relative path from routes folder for auto-prefixing
          const relativePath = filePath.replace(resolve(cwd, baseDir, dir), "").replace(ext, "");
          data.push({ route: imported as AnyRoute, filePath: relativePath });
        }
      }
    }

    return data;
  } catch {
    return [];
  }
}

/**
 * Converts a file path to a route path.
 * - Converts [param] to :param for dynamic routes
 * - Removes /index suffix
 *
 * Examples:
 *   /health.ts -> /health
 *   /users/[userId]/xp.ts -> /users/:userId/xp
 *   /index.ts -> /
 */
function filePathToRoutePath(filePath: string): string {
  let routePath = filePath
    // Convert [param] to :param (Next.js style dynamic routes)
    .replace(/\[([^\]]+)\]/g, ":$1")
    // Remove /index suffix (index files map to parent path)
    .replace(/\/index$/, "")
    // Ensure path starts with /
    .replace(/^([^/])/, "/$1");

  // Handle root index
  if (routePath === "" || routePath === "/index") {
    routePath = "/";
  }

  return routePath;
}

export async function loadRoutes(modulesDir: string, debug = false): Promise<Map<string, AnyRoute[]>> {
  const moduleRoutes = new Map<string, AnyRoute[]>();

  try {
    const baseDir = isTypescript ? sourceFolder : distFolder;
    const modulesPath = resolve(cwd, baseDir, modulesDir);
    const modules = await readdir(modulesPath);

    for (const moduleName of modules) {
      const modulePath = resolve(modulesPath, moduleName);
      const stat = await lstat(modulePath);

      if (!stat.isDirectory()) continue;

      try {
        const routeData = await readRouteDir(`${modulesDir}/${moduleName}/routes`);

        if (routeData.length > 0) {
          const routes = routeData.map(({ route, filePath }) => ({
            ...route,
            // Override path with auto-generated path if not explicitly set
            path: route.path || filePathToRoutePath(filePath),
          }));
          moduleRoutes.set(moduleName, routes);

          if (debug) {
            for (const route of routes) {
              Logger.info(`Route registered: [${route.method}] /${moduleName}${route.path}`);
            }
          }
        }
      } catch {
        // Module might not have routes directory, continue
      }
    }
  } catch (error) {
    Logger.error("Failed to load routes", error as Error);
  }

  return moduleRoutes;
}
