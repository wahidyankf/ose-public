import type { ContentMeta } from "./types";
import type { ContentRepository } from "./repository";

interface FileData {
  content: string;
  frontmatter: Record<string, unknown>;
}

export class InMemoryContentRepository implements ContentRepository {
  private readonly items: ContentMeta[];
  private readonly files: Map<string, FileData>;

  constructor(items: ContentMeta[], files: Map<string, FileData>) {
    this.items = items;
    this.files = files;
  }

  async readAllContent(): Promise<ContentMeta[]> {
    return this.items;
  }

  async readFileContent(filePath: string): Promise<{ content: string; frontmatter: Record<string, unknown> }> {
    const data = this.files.get(filePath);
    if (!data) {
      throw new Error(`File not found in memory repository: ${filePath}`);
    }
    return data;
  }
}
