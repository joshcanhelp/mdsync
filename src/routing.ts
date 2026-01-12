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
  const pathMatches = route.sourcePath ? minimatch(relativePath, route.sourcePath) : true;
  const tagMatches = route.tag ? tags.includes(route.tag) : true;

  // Both conditions must be true (AND logic)
  // If only sourcePath is specified, pathMatches must be true (tagMatches defaults to true)
  // If only tag is specified, tagMatches must be true (pathMatches defaults to true)
  // If both are specified, both must be true
  return pathMatches && tagMatches;
}
