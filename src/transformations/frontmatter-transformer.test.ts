import { describe, it, expect } from "vitest";
import { transformFrontmatter } from "./frontmatter-transformer.js";
import type { Config } from "../types.js";
import type { LinkMap } from "./types.js";

const createTestConfig = (
  contentProperties: string[] = [],
  passthroughProperties: string[] = [],
  wikilinkBehavior: "resolve" | "remove" | "preserve" = "resolve"
): Config => ({
  userId: "testuser",
  sourceDir: "/tmp/source",
  outputDir: "/tmp/output",
  routes: [],
  exclude: [],
  transformations: {
    urlProperty: "link_to",
    contentProperties,
    passthroughProperties,
    wikilinkBehavior,
    linkOverrides: {},
  },
});

describe("transformFrontmatter", () => {
  const linkMap: LinkMap = {
    "file1.md": "https://example.com/file1",
    "file2.md": "https://example.com/file2",
  };

  describe("content property injection", () => {
    it("should inject string content property into content", () => {
      const frontmatter = {
        tags: "important, notes",
        title: "My Title",
      };
      const content = "Main content here.";

      const result = transformFrontmatter(
        content,
        frontmatter,
        linkMap,
        createTestConfig(["tags"], ["title"]),
        "test.md"
      );

      expect(result.content).toBe("## Tags\n\n- important\n- notes\n\nMain content here.");
      expect(result.frontmatter).toEqual({ title: "My Title" });
    });

    it("should inject array content property as bullet list", () => {
      const frontmatter = {
        tags: ["#tech", "#programming", "#typescript"],
        title: "My Title",
      };
      const content = "Main content.";

      const result = transformFrontmatter(
        content,
        frontmatter,
        linkMap,
        createTestConfig(["tags"], ["title"]),
        "test.md"
      );

      expect(result.content).toBe(
        "## Tags\n\n- #tech\n- #programming\n- #typescript\n\nMain content."
      );
      expect(result.frontmatter).toEqual({ title: "My Title" });
    });

    it("should transform wikilinks in content properties", () => {
      const frontmatter = {
        references: "See [[file1.md]] and [[file2.md]]",
        title: "Title",
      };
      const content = "Content.";

      const result = transformFrontmatter(
        content,
        frontmatter,
        linkMap,
        createTestConfig(["references"], ["title"]),
        "test.md"
      );

      expect(result.content).toBe(
        "## References\n\n- See [file1.md](https://example.com/file1) and [file2.md](https://example.com/file2)\n\nContent."
      );
    });

    it("should track unresolved links in content properties", () => {
      const frontmatter = {
        references: "[[missing.md]]",
      };

      const result = transformFrontmatter(
        "",
        frontmatter,
        {},
        createTestConfig(["references"], []),
        "test.md"
      );

      expect(result.unresolvedLinks).toHaveLength(1);
      expect(result.unresolvedLinks[0].wikilink).toBe("[[missing.md]]");
      expect(result.unresolvedLinks[0].filePath).toBe("test.md");
    });

    it("should inject multiple content properties in order", () => {
      const frontmatter = {
        tags: "#tag1, #tag2",
        created: "2024-01-01",
        title: "Title",
      };

      const result = transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig(["tags", "created"], ["title"]),
        "test.md"
      );

      expect(result.content).toBe(
        "## Tags\n\n- #tag1\n- #tag2\n\n## Created\n\n- 2024-01-01\n\nContent"
      );
      expect(result.frontmatter).toEqual({ title: "Title" });
    });

    it("should handle missing content properties gracefully", () => {
      const frontmatter = {
        title: "Title",
      };

      const result = transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig(["tags", "created"], ["title"]),
        "test.md"
      );

      expect(result.content).toBe("Content");
      expect(result.frontmatter).toEqual({ title: "Title" });
    });
  });

  describe("passthrough properties", () => {
    it("should keep passthrough properties in output frontmatter", () => {
      const frontmatter = {
        title: "My Title",
        author: "John Doe",
        date: "2024-01-01",
      };

      const result = transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig([], ["title", "author"]),
        "test.md"
      );

      expect(result.frontmatter).toEqual({
        title: "My Title",
        author: "John Doe",
      });
    });

    it("should preserve data types in passthrough properties", () => {
      const frontmatter = {
        count: 42,
        enabled: true,
        items: ["a", "b", "c"],
        nested: { foo: "bar" },
      };

      const result = transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig([], ["count", "enabled", "items", "nested"]),
        "test.md"
      );

      expect(result.frontmatter).toEqual({
        count: 42,
        enabled: true,
        items: ["a", "b", "c"],
        nested: { foo: "bar" },
      });
    });

    it("should handle missing passthrough properties gracefully", () => {
      const frontmatter = {
        title: "Title",
      };

      const result = transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig([], ["title", "author", "date"]),
        "test.md"
      );

      expect(result.frontmatter).toEqual({ title: "Title" });
    });
  });

  describe("property filtering", () => {
    it("should omit properties not in content or passthrough lists", () => {
      const frontmatter = {
        title: "Keep",
        tags: "Inject",
        draft: true,
        internal: "Remove",
        metadata: { foo: "bar" },
      };

      const result = transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig(["tags"], ["title"]),
        "test.md"
      );

      expect(result.frontmatter).toEqual({ title: "Keep" });
      expect(result.content).toBe("## Tags\n\n- Inject\n\nContent");
    });

    it("should handle empty configuration lists", () => {
      const frontmatter = {
        title: "Title",
        author: "Author",
        tags: "Tags",
      };

      const result = transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig(),
        "test.md"
      );

      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe("Content");
    });
  });

  describe("main content transformation", () => {
    it("should transform wikilinks in main content", () => {
      const content = "See [[file1.md]] for details.";

      const result = transformFrontmatter(content, {}, linkMap, createTestConfig(), "test.md");

      expect(result.content).toBe("See [file1.md](https://example.com/file1) for details.");
    });

    it("should track unresolved links in main content", () => {
      const content = "[[missing.md]]";

      const result = transformFrontmatter(content, {}, {}, createTestConfig(), "test.md");

      expect(result.unresolvedLinks).toHaveLength(1);
      expect(result.unresolvedLinks[0].wikilink).toBe("[[missing.md]]");
    });

    it("should combine unresolved links from properties and content", () => {
      const frontmatter = {
        references: "[[missing1.md]]",
      };
      const content = "[[missing2.md]]";

      const result = transformFrontmatter(
        content,
        frontmatter,
        {},
        createTestConfig(["references"]),
        "test.md"
      );

      expect(result.unresolvedLinks).toHaveLength(2);
      expect(result.unresolvedLinks[0].wikilink).toBe("[[missing1.md]]");
      expect(result.unresolvedLinks[1].wikilink).toBe("[[missing2.md]]");
    });
  });

  describe("wikilink behavior modes", () => {
    it("should extract text from unresolved wikilinks in content properties", () => {
      const frontmatter = {
        references: "[[missing.md]]",
      };
      const content = "[[missing.md]]";

      const result = transformFrontmatter(
        content,
        frontmatter,
        {},
        createTestConfig(["references"], [], "remove"),
        "test.md"
      );

      // Content properties extract text from unresolved wikilinks, main content respects wikilinkBehavior
      expect(result.content).toBe("## References\n\n- missing.md\n\n");
      expect(result.unresolvedLinks).toHaveLength(2);
    });

    it("should respect preserve behavior in main content only", () => {
      const frontmatter = {
        references: "[[file1.md]]",
      };
      const content = "[[file1.md]]";

      const result = transformFrontmatter(
        content,
        frontmatter,
        linkMap,
        createTestConfig(["references"], [], "preserve"),
        "test.md"
      );

      // Content properties get resolved and formatted, main content preserved
      expect(result.content).toBe(
        "## References\n\n- [file1.md](https://example.com/file1)\n\n[[file1.md]]"
      );
      expect(result.unresolvedLinks).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("should handle empty content", () => {
      const result = transformFrontmatter("", {}, linkMap, createTestConfig(), "test.md");

      expect(result.content).toBe("");
      expect(result.frontmatter).toEqual({});
      expect(result.unresolvedLinks).toEqual([]);
    });

    it("should handle empty frontmatter", () => {
      const result = transformFrontmatter("Content", {}, linkMap, createTestConfig(), "test.md");

      expect(result.content).toBe("Content");
      expect(result.frontmatter).toEqual({});
    });

    it("should handle null and undefined property values", () => {
      const frontmatter = {
        nullProp: null,
        undefinedProp: undefined,
        title: "Title",
      };

      const result = transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig(["nullProp", "undefinedProp"], ["title"]),
        "test.md"
      );

      expect(result.content).toBe("Content");
      expect(result.frontmatter).toEqual({ title: "Title" });
    });

    it("should handle numeric and boolean content properties", () => {
      const frontmatter = {
        count: 42,
        enabled: true,
      };

      const result = transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig(["count", "enabled"]),
        "test.md"
      );

      expect(result.content).toBe("## Count\n\n- 42\n\n## Enabled\n\n- true\n\nContent");
    });

    it("should handle object content properties", () => {
      const frontmatter = {
        metadata: { foo: "bar", baz: 123 },
      };

      const result = transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig(["metadata"]),
        "test.md"
      );

      expect(result.content).toBe('## Metadata\n\n- {"foo":"bar","baz":123}\n\nContent');
    });
  });
});
