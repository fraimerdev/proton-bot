import type { AnyCommand } from "../types/command";
import type { ClientEventKey, Event } from "../types/event";
import type { Route } from "../types/route";

export function createEvent<T extends ClientEventKey, Ready extends boolean = true>(event: Event<T, Ready>) {
  return event;
}

export function createCommand<T extends AnyCommand>(command: T): T {
  return command;
}

export function createRoute<T extends Route>(route: T): T {
  return route;
}
