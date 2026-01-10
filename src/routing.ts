import { minimatch } from "minimatch";
import type { Route } from "./types.js";

export function matchRoute(relativePath: string, tags: string[], routes: Route[]): Route | null {
  for (const route of routes) {
    if (isRouteMatch(relativePath, tags, route)) {
      return route;
    }
  }
  return null;
}

function isRouteMatch(relativePath: string, tags: string[], route: Route): boolean {
  const pathMatches = route.sourcePath ? minimatch(relativePath, route.sourcePath) : false;
  const tagMatches = route.tag ? tags.includes(route.tag) : false;

  if (route.sourcePath && route.tag) {
    return pathMatches || tagMatches;
  }

  if (route.sourcePath) {
    return pathMatches;
  }

  if (route.tag) {
    return tagMatches;
  }

  return false;
}
