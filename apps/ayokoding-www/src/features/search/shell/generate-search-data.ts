import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { FileSystemContentRepository } from "@/features/content/shell/repository-fs";
import { stripMarkdown } from "@/features/content/shell/reader";
import type { SearchDoc } from "@/features/content/shell/service";
import type { ContentRepository } from "@/features/content/core/repository";

const contentDir = path.resolve(process.cwd(), "content");
const outputDir = path.resolve(process.cwd(), "generated");
const outputFile = path.join(outputDir, "search-data.json");

/** Builds the searchable documents from a content repository; pure I/O through the repository port. */
export async function buildSearchDocs(
  repository: Pick<ContentRepository, "readAllContent" | "readFileContent">,
): Promise<SearchDoc[]> {
  const allContent = await repository.readAllContent();
  const searchable = allContent.filter((c) => !c.isSection && !c.draft);

  const docs: SearchDoc[] = [];

  for (const item of searchable) {
    try {
      const { content } = await repository.readFileContent(item.filePath);
      const plainText = stripMarkdown(content).slice(0, 2000);
      docs.push({
        id: `${item.locale}:${item.slug}`,
        title: item.title,
        content: plainText,
        slug: item.slug,
        locale: item.locale,
      });
    } catch {
      // Skip files that can't be read
    }
  }

  return docs;
}

async function main() {
  const repository = new FileSystemContentRepository(contentDir);
  const docs = await buildSearchDocs(repository);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(docs), "utf-8");

  const sizeMB = (Buffer.byteLength(JSON.stringify(docs)) / 1024 / 1024).toFixed(1);
  console.log(`Generated search data: ${docs.length} documents (${sizeMB} MB)`);
}

// Run the I/O shell only when invoked directly as a script, never when imported (e.g. by the unit
// tests, which exercise buildSearchDocs with a memory repository).
const invokedDirectly =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
