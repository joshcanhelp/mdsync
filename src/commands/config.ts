import { loadConfig } from "../config.js";

export async function configCommand(): Promise<void> {
  const config = await loadConfig();

  console.log("Current Configuration\n");

  console.log("User Settings:");
  console.log(`  User ID:     ${config.userId}`);
  console.log(`  Source:      ${config.sourceDir}`);
  console.log(`  Output:      ${config.outputDir}`);

  if (config.requireTags && config.requireTags.length > 0) {
    console.log(`\nRequired Tags: ${config.requireTags.map((t) => `#${t}`).join(", ")}`);
  }

  if (config.requireProps && Object.keys(config.requireProps).length > 0) {
    console.log("\nRequired Properties:");
    for (const [key, value] of Object.entries(config.requireProps)) {
      const displayValue = Array.isArray(value) ? value.join(" | ") : value;
      console.log(`  ${key}: ${displayValue}`);
    }
  }

  if (config.exclude.length > 0) {
    console.log("\nExclude Patterns:");
    for (const pattern of config.exclude) {
      console.log(`  ${pattern}`);
    }
  }

  console.log("\nRoutes:");
  if (config.routes.length === 0) {
    console.log("  (none configured)");
  } else {
    for (const route of config.routes) {
      const conditions = [];
      if (route.sourcePath) conditions.push(`path: ${route.sourcePath}`);
      if (route.tag) conditions.push(`tag: #${route.tag}`);
      const condition = conditions.length > 0 ? conditions.join(", ") : "all files";
      console.log(`  ${condition} → ${route.outputPath}`);
    }
  }

  console.log("\nTransformations:");
  const t = config.transformations;
  console.log(`  Wikilink behavior: ${t.wikilinkBehavior || "resolve"}`);
  if (t.urlProperty) {
    console.log(`  URL property:      ${t.urlProperty}`);
  }
  if (t.contentProperties && t.contentProperties.length > 0) {
    console.log(`  Content properties: ${t.contentProperties.join(", ")}`);
  }
  if (t.passthroughProperties && t.passthroughProperties.length > 0) {
    console.log(`  Passthrough props:  ${t.passthroughProperties.join(", ")}`);
  }
  if (t.linkOverrides && Object.keys(t.linkOverrides).length > 0) {
    console.log(`  Link overrides:     ${Object.keys(t.linkOverrides).length} configured`);
  }
  if (t.propertyTransforms && Object.keys(t.propertyTransforms).length > 0) {
    console.log(`  Property transforms: ${Object.keys(t.propertyTransforms).join(", ")}`);
  }
  if (t.contentTransform) {
    console.log("  Content transform:  custom function configured");
  }
  if (t.filenameTransform) {
    console.log("  Filename transform: custom function configured");
  }
}
