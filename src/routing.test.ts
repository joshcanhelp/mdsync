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

  it("should match by BOTH sourcePath AND tag when both specified", () => {
    const routes: Route[] = [
      {
        sourcePath: "Archive/**/*.md",
        tag: "archived",
        outputPath: "archive",
      },
    ];

    // Should match when both path AND tag match
    const resultBoth = matchRoute("Archive/2023/old-note.md", ["archived"], routes);
    expect(resultBoth).toEqual(routes[0]);

    // Should NOT match when only path matches (no tag)
    const resultPathOnly = matchRoute("Archive/2023/old-note.md", [], routes);
    expect(resultPathOnly).toBeNull();

    // Should NOT match when only tag matches (wrong path)
    const resultTagOnly = matchRoute("notes/old-project.md", ["archived"], routes);
    expect(resultTagOnly).toBeNull();
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
