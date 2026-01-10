import { describe, it, expect } from "vitest";
import { matchRoute } from "./routing.js";
import type { Route } from "./types.js";

describe("matchRoute", () => {
  it("should match by sourcePath glob pattern", () => {
    const routes: Route[] = [
      {
        sourcePath: "Logs/**/*.md",
        outputPath: "logs",
      },
    ];

    const result = matchRoute("Logs/2024/daily.md", [], routes);

    expect(result).toEqual(routes[0]);
  });

  it("should match by tag", () => {
    const routes: Route[] = [
      {
        tag: "working",
        outputPath: "projects",
      },
    ];

    const result = matchRoute("notes/project.md", ["working", "urgent"], routes);

    expect(result).toEqual(routes[0]);
  });

  it("should match by either sourcePath OR tag when both specified", () => {
    const routes: Route[] = [
      {
        sourcePath: "Archive/**/*.md",
        tag: "archived",
        outputPath: "archive",
      },
    ];

    const resultByPath = matchRoute("Archive/2023/old-note.md", [], routes);
    expect(resultByPath).toEqual(routes[0]);

    const resultByTag = matchRoute("notes/old-project.md", ["archived"], routes);
    expect(resultByTag).toEqual(routes[0]);
  });

  it("should return first matching route", () => {
    const routes: Route[] = [
      {
        sourcePath: "Logs/**/*.md",
        outputPath: "logs",
      },
      {
        sourcePath: "**/*.md",
        outputPath: "notes",
      },
    ];

    const result = matchRoute("Logs/daily.md", [], routes);

    expect(result).toEqual(routes[0]);
  });

  it("should return null when no route matches", () => {
    const routes: Route[] = [
      {
        sourcePath: "Logs/**/*.md",
        outputPath: "logs",
      },
    ];

    const result = matchRoute("Documents/note.md", [], routes);

    expect(result).toBeNull();
  });

  it("should handle case-sensitive path matching", () => {
    const routes: Route[] = [
      {
        sourcePath: "Logs/**/*.md",
        outputPath: "logs",
      },
    ];

    const result = matchRoute("logs/daily.md", [], routes);

    expect(result).toBeNull();
  });

  it("should match nested paths correctly", () => {
    const routes: Route[] = [
      {
        sourcePath: "Projects/**/specs/*.md",
        outputPath: "specs",
      },
    ];

    const result = matchRoute("Projects/web/specs/api.md", [], routes);

    expect(result).toEqual(routes[0]);
  });

  it("should not match when tag is missing", () => {
    const routes: Route[] = [
      {
        tag: "working",
        outputPath: "projects",
      },
    ];

    const result = matchRoute("notes/project.md", ["draft"], routes);

    expect(result).toBeNull();
  });

  it("should match catch-all pattern", () => {
    const routes: Route[] = [
      {
        sourcePath: "**/*.md",
        outputPath: "notes",
      },
    ];

    const result = matchRoute("any/nested/path/file.md", [], routes);

    expect(result).toEqual(routes[0]);
  });
});
