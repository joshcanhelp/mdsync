/**
 * User ID detection and resolution
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export function detectUserId(configUserId?: string): string {
  if (configUserId) {
    return sanitizeUserId(configUserId);
  }

  const envUserId = process.env.MARKDOWN_SYNC_USER;
  if (envUserId) {
    return sanitizeUserId(envUserId);
  }

  const email = readGitConfig();
  if (email) {
    const username = email.split("@")[0];
    if (username) {
      return sanitizeUserId(username);
    }
  }

  throw new Error(
    "Unable to detect user ID. Please set one of:\n" +
      "  1. userId in .markdown-sync.user.js\n" +
      "  2. MARKDOWN_SYNC_USER environment variable\n" +
      "  3. git config user.email"
  );
}

function readGitConfig(): string | null {
  const globalConfigPath = join(homedir(), ".gitconfig");

  try {
    const content = readFileSync(globalConfigPath, "utf-8");
    const match = content.match(/^\s*email\s*=\s*(.+)$/m);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

export function sanitizeUserId(userId: string): string {
  return userId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
