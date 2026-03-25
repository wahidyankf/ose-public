import path from "node:path";
import fs from "node:fs/promises";
import { FileSystemContentRepository } from "../server/content/repository-fs";
import { stripMarkdown } from "../server/content/reader";
import type { SearchDoc } from "../server/content/service";

const contentDir = path.resolve(process.cwd(), "content");
const outputDir = path.resolve(process.cwd(), "generated");
const outputFile = path.join(outputDir, "search-data.json");

async function main() {
  const repository = new FileSystemContentRepository(contentDir);
  const allContent = await repository.readAllContent();
  const searchable = allContent.filter((c) => !c.isSection && !c.draft);

  const docs: SearchDoc[] = [];

  for (const item of searchable) {
    try {
      const { content } = await repository.readFileContent(item.filePath);
      const plainText = stripMarkdown(content);
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

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(docs), "utf-8");

  const sizeMB = (Buffer.byteLength(JSON.stringify(docs)) / 1024 / 1024).toFixed(1);
  console.log(`Generated search data: ${docs.length} documents (${sizeMB} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
