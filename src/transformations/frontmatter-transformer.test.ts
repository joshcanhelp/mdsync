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
    it("should inject string content property into content", async () => {
      const frontmatter = {
        tags: "important, notes",
        title: "My Title",
      };
      const content = "Main content here.";

      const result = await transformFrontmatter(
        content,
        frontmatter,
        linkMap,
        createTestConfig(["tags"], ["title"]),
        "test.md"
      );

      expect(result.content).toBe("## Tags\n\n- important\n- notes\n\n---\n\nMain content here.");
      expect(result.frontmatter).toEqual({ title: "My Title" });
    });

    it("should inject array content property as bullet list", async () => {
      const frontmatter = {
        tags: ["#tech", "#programming", "#typescript"],
        title: "My Title",
      };
      const content = "Main content.";

      const result = await transformFrontmatter(
        content,
        frontmatter,
        linkMap,
        createTestConfig(["tags"], ["title"]),
        "test.md"
      );

      expect(result.content).toBe(
        "## Tags\n\n- #tech\n- #programming\n- #typescript\n\n---\n\nMain content."
      );
      expect(result.frontmatter).toEqual({ title: "My Title" });
    });

    it("should transform wikilinks in content properties", async () => {
      const frontmatter = {
        references: "See [[file1.md]] and [[file2.md]]",
        title: "Title",
      };
      const content = "Content.";

      const result = await transformFrontmatter(
        content,
        frontmatter,
        linkMap,
        createTestConfig(["references"], ["title"]),
        "test.md"
      );

      expect(result.content).toBe(
        "## References\n\n- See [file1.md](https://example.com/file1) and [file2.md](https://example.com/file2)\n\n---\n\nContent."
      );
    });

    it("should track unresolved links in content properties", async () => {
      const frontmatter = {
        references: "[[missing.md]]",
      };

      const result = await transformFrontmatter(
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

    it("should inject multiple content properties in order", async () => {
      const frontmatter = {
        tags: "#tag1, #tag2",
        created: "2024-01-01",
        title: "Title",
      };

      const result = await transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig(["tags", "created"], ["title"]),
        "test.md"
      );

      expect(result.content).toBe(
        "## Tags\n\n- #tag1\n- #tag2\n\n## Created\n\n- 2024-01-01\n\n---\n\nContent"
      );
      expect(result.frontmatter).toEqual({ title: "Title" });
    });

    it("should handle missing content properties gracefully", async () => {
      const frontmatter = {
        title: "Title",
      };

      const result = await transformFrontmatter(
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
    it("should keep passthrough properties in output frontmatter", async () => {
      const frontmatter = {
        title: "My Title",
        author: "John Doe",
        date: "2024-01-01",
      };

      const result = await transformFrontmatter(
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

    it("should preserve data types in passthrough properties", async () => {
      const frontmatter = {
        count: 42,
        enabled: true,
        items: ["a", "b", "c"],
        nested: { foo: "bar" },
      };

      const result = await transformFrontmatter(
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

    it("should handle missing passthrough properties gracefully", async () => {
      const frontmatter = {
        title: "Title",
      };

      const result = await transformFrontmatter(
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
    it("should omit properties not in content or passthrough lists", async () => {
      const frontmatter = {
        title: "Keep",
        tags: "Inject",
        draft: true,
        internal: "Remove",
        metadata: { foo: "bar" },
      };

      const result = await transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig(["tags"], ["title"]),
        "test.md"
      );

      expect(result.frontmatter).toEqual({ title: "Keep" });
      expect(result.content).toBe("## Tags\n\n- Inject\n\n---\n\nContent");
    });

    it("should handle empty configuration lists", async () => {
      const frontmatter = {
        title: "Title",
        author: "Author",
        tags: "Tags",
      };

      const result = await transformFrontmatter(
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
    it("should transform wikilinks in main content", async () => {
      const content = "See [[file1.md]] for details.";

      const result = await transformFrontmatter(
        content,
        {},
        linkMap,
        createTestConfig(),
        "test.md"
      );

      expect(result.content).toBe("See [file1.md](https://example.com/file1) for details.");
    });

    it("should track unresolved links in main content", async () => {
      const content = "[[missing.md]]";

      const result = await transformFrontmatter(content, {}, {}, createTestConfig(), "test.md");

      expect(result.unresolvedLinks).toHaveLength(1);
      expect(result.unresolvedLinks[0].wikilink).toBe("[[missing.md]]");
    });

    it("should combine unresolved links from properties and content", async () => {
      const frontmatter = {
        references: "[[missing1.md]]",
      };
      const content = "[[missing2.md]]";

      const result = await transformFrontmatter(
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
    it("should extract text from unresolved wikilinks in content properties", async () => {
      const frontmatter = {
        references: "[[missing.md]]",
      };
      const content = "[[missing.md]]";

      const result = await transformFrontmatter(
        content,
        frontmatter,
        {},
        createTestConfig(["references"], [], "remove"),
        "test.md"
      );

      // Content properties extract text from unresolved wikilinks, main content respects wikilinkBehavior
      expect(result.content).toBe("## References\n\n- missing\n\n---\n\n");
      expect(result.unresolvedLinks).toHaveLength(2);
    });

    it("should respect preserve behavior in main content only", async () => {
      const frontmatter = {
        references: "[[file1.md]]",
      };
      const content = "[[file1.md]]";

      const result = await transformFrontmatter(
        content,
        frontmatter,
        linkMap,
        createTestConfig(["references"], [], "preserve"),
        "test.md"
      );

      // Content properties get resolved and formatted, main content preserved
      expect(result.content).toBe(
        "## References\n\n- [file1.md](https://example.com/file1)\n\n---\n\n[[file1.md]]"
      );
      expect(result.unresolvedLinks).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("should handle empty content", async () => {
      const result = await transformFrontmatter("", {}, linkMap, createTestConfig(), "test.md");

      expect(result.content).toBe("");
      expect(result.frontmatter).toEqual({});
      expect(result.unresolvedLinks).toEqual([]);
    });

    it("should handle empty frontmatter", async () => {
      const result = await transformFrontmatter(
        "Content",
        {},
        linkMap,
        createTestConfig(),
        "test.md"
      );

      expect(result.content).toBe("Content");
      expect(result.frontmatter).toEqual({});
    });

    it("should handle null and undefined property values", async () => {
      const frontmatter = {
        nullProp: null,
        undefinedProp: undefined,
        title: "Title",
      };

      const result = await transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig(["nullProp", "undefinedProp"], ["title"]),
        "test.md"
      );

      expect(result.content).toBe("Content");
      expect(result.frontmatter).toEqual({ title: "Title" });
    });

    it("should handle numeric and boolean content properties", async () => {
      const frontmatter = {
        count: 42,
        enabled: true,
      };

      const result = await transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig(["count", "enabled"]),
        "test.md"
      );

      expect(result.content).toBe("## Count\n\n- 42\n\n## Enabled\n\n- true\n\n---\n\nContent");
    });

    it("should handle object content properties", async () => {
      const frontmatter = {
        metadata: { foo: "bar", baz: 123 },
      };

      const result = await transformFrontmatter(
        "Content",
        frontmatter,
        linkMap,
        createTestConfig(["metadata"]),
        "test.md"
      );

      expect(result.content).toBe('## Metadata\n\n- {"foo":"bar","baz":123}\n\n---\n\nContent');
    });
  });

  describe("custom transforms", () => {
    it("should apply custom property transform to passthrough properties", async () => {
      const frontmatter = {
        title: "my title",
        author: "john doe",
      };

      const config = createTestConfig([], ["title", "author"]);
      config.transformations.propertyTransforms = {
        title: (value) => value.toUpperCase(),
        author: (value) =>
          value
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
      };

      const result = await transformFrontmatter("Content", frontmatter, {}, config, "test.md");

      expect(result.frontmatter).toEqual({
        title: "MY TITLE",
        author: "John Doe",
      });
    });

    it("should pass context to property transform", async () => {
      const frontmatter = { title: "Test", path: "" };

      const config = createTestConfig([], ["title", "path"]);
      config.transformations.propertyTransforms = {
        path: (_value, context) => context.filePath,
      };

      const result = await transformFrontmatter(
        "Content",
        frontmatter,
        {},
        config,
        "notes/test.md"
      );

      expect(result.frontmatter.path).toBe("notes/test.md");
    });

    it("should apply custom content transform", async () => {
      const config = createTestConfig();
      config.transformations.contentTransform = (content) => content.replace(/TODO:/g, "⚠️ TODO:");

      const result = await transformFrontmatter(
        "TODO: Fix this\n\nTODO: And this",
        {},
        {},
        config,
        "test.md"
      );

      expect(result.content).toBe("⚠️ TODO: Fix this\n\n⚠️ TODO: And this");
    });

    it("should pass context to content transform", async () => {
      const frontmatter = { author: "Alice" };

      const config = createTestConfig();
      config.transformations.contentTransform = (content, context) => {
        const author = context.frontmatter.author;
        return `By: ${author}\n\n${content}`;
      };

      const result = await transformFrontmatter("Content here", frontmatter, {}, config, "test.md");

      expect(result.content).toBe("By: Alice\n\nContent here");
    });

    it("should only transform string values in property transforms", async () => {
      const frontmatter = {
        title: "Test",
        count: 42,
        tags: ["a", "b"],
      };

      const config = createTestConfig([], ["title", "count", "tags"]);
      config.transformations.propertyTransforms = {
        title: (value) => value.toUpperCase(),
        count: () => "SHOULD NOT BE CALLED",
        tags: () => "SHOULD NOT BE CALLED",
      };

      const result = await transformFrontmatter("Content", frontmatter, {}, config, "test.md");

      expect(result.frontmatter).toEqual({
        title: "TEST",
        count: 42,
        tags: ["a", "b"],
      });
    });

    it("should apply content transform after all other transformations", async () => {
      const frontmatter = { references: "[[file1.md]]" };
      const linkMap = { "file1.md": "https://example.com/file1" };

      const config = createTestConfig(["references"]);
      config.transformations.contentTransform = (content) =>
        `<!-- START -->\n${content}\n<!-- END -->`;

      const result = await transformFrontmatter(
        "Main content",
        frontmatter,
        linkMap,
        config,
        "test.md"
      );

      expect(result.content).toBe(
        "<!-- START -->\n## References\n\n- [file1.md](https://example.com/file1)\n\n---\n\nMain content\n<!-- END -->"
      );
    });
  });
});
