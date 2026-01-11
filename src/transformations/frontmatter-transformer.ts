import { transformWikilinks } from "./link-resolver.js";
import type { Config } from "../types.js";
import type { LinkMap, UnresolvedLink, TransformationResult } from "./types.js";

export async function transformFrontmatter(
  content: string,
  frontmatter: Record<string, unknown>,
  linkMap: LinkMap,
  config: Config,
  currentFilePath: string
): Promise<TransformationResult> {
  const unresolvedLinks: UnresolvedLink[] = [];
  let transformedContent = content;

  const contentProperties = config.transformations.contentProperties || [];
  const passthroughProperties = config.transformations.passthroughProperties || [];
  const wikilinkBehavior = config.transformations.wikilinkBehavior || "resolve";

  // Process content properties: inject into content with wikilink transformation
  const contentPropertiesToInject: string[] = [];
  for (const prop of contentProperties) {
    if (prop in frontmatter) {
      const value = frontmatter[prop];
      const items = formatPropertyValueAsList(value);
      if (items.length < 1) {
        continue;
      }
      const listItems: string[] = [];

      // Transform wikilinks in each item and format as bullet list
      for (const item of items) {
        const result = transformWikilinks(item, linkMap, "resolve", currentFilePath);
        // Strip unresolved wikilinks when in resolve mode
        const cleanedContent = removeUnresolvedWikilinks(result.content);
        if (cleanedContent.trim()) {
          listItems.push(`- ${cleanedContent}`);
        }
        unresolvedLinks.push(...result.unresolvedLinks);
      }

      // Only add the property if there are items after cleaning
      if (listItems.length > 0) {
        const heading = `## ${capitalizeFirstLetter(prop)}`;
        const lines = [heading, "", ...listItems];
        contentPropertiesToInject.push(lines.join("\n"));
      }
    }
  }

  // Transform wikilinks in main content (before injecting properties)
  const contentResult = transformWikilinks(
    transformedContent,
    linkMap,
    wikilinkBehavior,
    currentFilePath
  );
  transformedContent = contentResult.content;
  unresolvedLinks.push(...contentResult.unresolvedLinks);

  // Inject content properties at the beginning (after transformation)
  if (contentPropertiesToInject.length > 0) {
    transformedContent =
      contentPropertiesToInject.join("\n\n") + "\n\n---\n\n" + transformedContent;
  }

  // Apply custom content transform if defined
  const contentTransform = config.transformations.contentTransform;
  if (contentTransform) {
    const transformContext = {
      filePath: currentFilePath,
      frontmatter,
    };
    transformedContent = await contentTransform(transformedContent, transformContext);
  }

  // Build output frontmatter with only passthrough properties
  const outputFrontmatter: Record<string, unknown> = {};
  const propertyTransforms = config.transformations.propertyTransforms || {};
  const transformContext = {
    filePath: currentFilePath,
    frontmatter,
  };

  for (const prop of passthroughProperties) {
    if (prop in frontmatter) {
      let value = frontmatter[prop];

      // Apply custom transform if defined for this property
      if (prop in propertyTransforms && typeof value === "string") {
        const transformer = propertyTransforms[prop];
        value = await transformer(value, transformContext);
      }

      outputFrontmatter[prop] = value;
    }
  }

  return {
    content: transformedContent,
    frontmatter: outputFrontmatter,
    unresolvedLinks,
  };
}

function formatPropertyValueAsList(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === "string") {
    // Split on commas or newlines to create list items
    return value
      .split(/[,\n]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter((item) => item.length > 0);
  }

  if (typeof value === "object") {
    // For objects, just stringify them as a single item
    return [JSON.stringify(value)];
  }

  // For other types (boolean, number, etc), convert to string
  return [String(value)];
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function removeUnresolvedWikilinks(content: string): string {
  // Replace unresolved wikilinks with their text content
  // [[Link]] -> Link
  // [[Link|Display Text]] -> Display Text
  return content.replace(
    /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g,
    (_match, linkTarget, _pipe, displayText) => {
      // Use display text if provided, otherwise use the link target
      return displayText ? displayText.trim() : linkTarget.trim();
    }
  );
}
