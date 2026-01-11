import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import {
  findFileEmbeds,
  findFileInSource,
  copyEmbeddedFile,
  transformFileEmbeds,
} from "./file-embed-transformer.js";

const TEST_DIR = join(process.cwd(), "test-temp-file-embeds");
const SOURCE_DIR = join(TEST_DIR, "source");
const OUTPUT_DIR = join(TEST_DIR, "output");

describe("findFileEmbeds", () => {
  it("should find image embeds with exclamation mark", () => {
    const content = "Check out ![[image.png]] for details.";
    const embeds = findFileEmbeds(content);

    expect(embeds).toHaveLength(1);
    expect(embeds[0]).toEqual({
      originalSyntax: "![[image.png]]",
      filename: "image.png",
      isImage: true,
      displayText: undefined,
    });
  });

  it("should find file embeds without exclamation mark", () => {
    const content = "See [[document.pdf]] for more info.";
    const embeds = findFileEmbeds(content);

    expect(embeds).toHaveLength(1);
    expect(embeds[0]).toEqual({
      originalSyntax: "[[document.pdf]]",
      filename: "document.pdf",
      isImage: false,
      displayText: undefined,
    });
  });

  it("should find embeds with display text", () => {
    const content = "View ![[image.png|My Image]] here.";
    const embeds = findFileEmbeds(content);

    expect(embeds).toHaveLength(1);
    expect(embeds[0]).toEqual({
      originalSyntax: "![[image.png|My Image]]",
      filename: "image.png",
      isImage: true,
      displayText: "My Image",
    });
  });

  it("should detect images by extension even without exclamation", () => {
    const content = "[[photo.jpg]] and [[doc.pdf]]";
    const embeds = findFileEmbeds(content);

    expect(embeds).toHaveLength(2);
    expect(embeds[0].isImage).toBe(true);
    expect(embeds[1].isImage).toBe(false);
  });

  it("should skip .md files", () => {
    const content = "See [[note.md]] and [[image.png]]";
    const embeds = findFileEmbeds(content);

    expect(embeds).toHaveLength(1);
    expect(embeds[0].filename).toBe("image.png");
  });

  it("should find multiple embeds", () => {
    const content = "![[image1.png]] and [[doc.pdf]] and ![[image2.jpg]]";
    const embeds = findFileEmbeds(content);

    expect(embeds).toHaveLength(3);
    expect(embeds[0].filename).toBe("image1.png");
    expect(embeds[1].filename).toBe("doc.pdf");
    expect(embeds[2].filename).toBe("image2.jpg");
  });

  it("should handle empty content", () => {
    const embeds = findFileEmbeds("");
    expect(embeds).toHaveLength(0);
  });

  it("should handle various image extensions", () => {
    const content =
      "[[a.png]] [[b.jpg]] [[c.jpeg]] [[d.gif]] [[e.svg]] [[f.webp]] [[g.bmp]] [[h.ico]]";
    const embeds = findFileEmbeds(content);

    expect(embeds).toHaveLength(8);
    embeds.forEach((embed) => {
      expect(embed.isImage).toBe(true);
    });
  });
});

describe("findFileInSource", () => {
  beforeEach(async () => {
    await mkdir(SOURCE_DIR, { recursive: true });
    await mkdir(join(SOURCE_DIR, "nested", "deep"), { recursive: true });
    await writeFile(join(SOURCE_DIR, "file1.txt"), "content");
    await writeFile(join(SOURCE_DIR, "nested", "file2.pdf"), "content");
    await writeFile(join(SOURCE_DIR, "nested", "deep", "file3.png"), "content");
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it("should find file in root directory", async () => {
    const result = await findFileInSource(SOURCE_DIR, "file1.txt");
    expect(result).toBe(join(SOURCE_DIR, "file1.txt"));
  });

  it("should find file in nested directory", async () => {
    const result = await findFileInSource(SOURCE_DIR, "file2.pdf");
    expect(result).toBe(join(SOURCE_DIR, "nested", "file2.pdf"));
  });

  it("should find file in deeply nested directory", async () => {
    const result = await findFileInSource(SOURCE_DIR, "file3.png");
    expect(result).toBe(join(SOURCE_DIR, "nested", "deep", "file3.png"));
  });

  it("should return null for non-existent file", async () => {
    const result = await findFileInSource(SOURCE_DIR, "missing.txt");
    expect(result).toBeNull();
  });
});

describe("copyEmbeddedFile", () => {
  beforeEach(async () => {
    await mkdir(SOURCE_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });
    await mkdir(join(SOURCE_DIR, "nested"), { recursive: true });
    await writeFile(join(SOURCE_DIR, "file1.txt"), "content1");
    await writeFile(join(SOURCE_DIR, "nested", "file2.pdf"), "content2");
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it("should copy file to _files directory preserving path", async () => {
    const sourceFile = join(SOURCE_DIR, "file1.txt");
    const outputPath = await copyEmbeddedFile(sourceFile, SOURCE_DIR, OUTPUT_DIR);

    expect(outputPath).toBe(join("_files", "file1.txt"));
  });

  it("should copy nested file preserving relative path", async () => {
    const sourceFile = join(SOURCE_DIR, "nested", "file2.pdf");
    const outputPath = await copyEmbeddedFile(sourceFile, SOURCE_DIR, OUTPUT_DIR);

    expect(outputPath).toBe(join("_files", "nested", "file2.pdf"));
  });

  it("should create necessary directories", async () => {
    const sourceFile = join(SOURCE_DIR, "nested", "file2.pdf");
    await copyEmbeddedFile(sourceFile, SOURCE_DIR, OUTPUT_DIR);

    const { readFile } = await import("node:fs/promises");
    const content = await readFile(join(OUTPUT_DIR, "_files", "nested", "file2.pdf"), "utf-8");
    expect(content).toBe("content2");
  });
});

describe("transformFileEmbeds", () => {
  beforeEach(async () => {
    await mkdir(SOURCE_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });
    await mkdir(join(SOURCE_DIR, "images"), { recursive: true });
    await writeFile(join(SOURCE_DIR, "doc.pdf"), "pdf content");
    await writeFile(join(SOURCE_DIR, "images", "photo.png"), "image content");
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it("should transform image embed with exclamation mark", async () => {
    const content = "Check out ![[photo.png]] here.";
    const result = await transformFileEmbeds(content, SOURCE_DIR, OUTPUT_DIR);

    expect(result.content).toBe("Check out ![photo](/_files/images/photo.png) here.");
    expect(result.copiedFiles).toHaveLength(1);
    expect(result.copiedFiles[0]).toBe(join("_files", "images", "photo.png"));
    expect(result.errors).toHaveLength(0);
  });

  it("should transform file embed without exclamation mark", async () => {
    const content = "See [[doc.pdf]] for details.";
    const result = await transformFileEmbeds(content, SOURCE_DIR, OUTPUT_DIR);

    expect(result.content).toBe("See [doc](/_files/doc.pdf) for details.");
    expect(result.copiedFiles).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("should use display text when provided", async () => {
    const content = "![[photo.png|My Photo]]";
    const result = await transformFileEmbeds(content, SOURCE_DIR, OUTPUT_DIR);

    expect(result.content).toBe("![My Photo](/_files/images/photo.png)");
  });

  it("should handle multiple embeds", async () => {
    const content = "![[photo.png]] and [[doc.pdf]]";
    const result = await transformFileEmbeds(content, SOURCE_DIR, OUTPUT_DIR);

    expect(result.content).toBe("![photo](/_files/images/photo.png) and [doc](/_files/doc.pdf)");
    expect(result.copiedFiles).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it("should return error for missing file", async () => {
    const content = "![[missing.png]]";
    const result = await transformFileEmbeds(content, SOURCE_DIR, OUTPUT_DIR);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("File embed not found: missing.png");
    expect(result.errors[0].message).toContain("Stopping sync");
    expect(result.copiedFiles).toHaveLength(0);
  });

  it("should handle empty content", async () => {
    const result = await transformFileEmbeds("", SOURCE_DIR, OUTPUT_DIR);

    expect(result.content).toBe("");
    expect(result.copiedFiles).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("should ignore .md file references", async () => {
    const content = "See [[note.md]] and ![[photo.png]]";
    const result = await transformFileEmbeds(content, SOURCE_DIR, OUTPUT_DIR);

    // .md file should remain unchanged, only photo should be transformed
    expect(result.content).toBe("See [[note.md]] and ![photo](/_files/images/photo.png)");
    expect(result.copiedFiles).toHaveLength(1);
  });
});
