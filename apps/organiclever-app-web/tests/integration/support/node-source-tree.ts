import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { SourceTree } from "../../unit/support/source-tree";

/** The real file-system adapter for the SourceTree port, rooted at one project directory. */
export function nodeSourceTree(root: string): SourceTree {
  const absolute = (relativePath: string) => path.join(root, relativePath);
  const walk = (relativeDir: string): string[] =>
    readdirSync(absolute(relativeDir)).flatMap((entry) => {
      const relativePath = `${relativeDir}/${entry}`;
      return statSync(absolute(relativePath)).isDirectory() ? walk(relativePath) : [relativePath];
    });
  return {
    exists: (relativePath) => existsSync(absolute(relativePath)),
    listFiles: (relativeDir) => (existsSync(absolute(relativeDir)) ? walk(relativeDir) : []),
    readText: (relativePath) => readFileSync(absolute(relativePath), "utf8"),
  };
}
