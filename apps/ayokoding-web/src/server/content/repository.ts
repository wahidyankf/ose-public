import type { ContentMeta } from "./types";

export interface ContentRepository {
  readAllContent(): Promise<ContentMeta[]>;
  readFileContent(filePath: string): Promise<{ content: string; frontmatter: Record<string, unknown> }>;
}
