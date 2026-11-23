import fs from "node:fs/promises";

/** One entry of a directory listing: its name, and whether it is itself a directory. */
export interface ContentDirectoryEntry {
  readonly name: string;
  isDirectory(): boolean;
}

/**
 * The file-system seam the content shell reads through. Unit tests pass an in-memory double; the real
 * adapter below is the only code that touches the disk.
 */
export interface ContentFs {
  readFile(filePath: string): Promise<string>;
  readDirectory(dirPath: string): Promise<ContentDirectoryEntry[]>;
}

export const nodeContentFs: ContentFs = {
  readFile: (filePath) => fs.readFile(filePath, "utf-8"),
  readDirectory: (dirPath) => fs.readdir(dirPath, { withFileTypes: true }),
};
