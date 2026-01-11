export interface LinkMap {
  [relativePath: string]: string;
}

export interface TransformationConfig {
  urlProperty: string;
  contentProperties: string[];
  passthroughProperties: string[];
  wikilinkBehavior: "resolve" | "remove" | "preserve";
  linkOverrides?: Record<string, string>;
}

export interface UnresolvedLink {
  wikilink: string;
  filePath: string;
}

export interface TransformationResult {
  content: string;
  frontmatter: Record<string, unknown>;
  unresolvedLinks: UnresolvedLink[];
}

export interface TransformationReport {
  unresolvedLinksCount: number;
  unresolvedLinks: UnresolvedLink[];
}
