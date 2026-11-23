import type { ContentFs } from "@/features/content/shell/content-fs";

export interface MemoryContentFsOptions {
  /** Absolute file path to file contents. Directories exist wherever a file lives beneath them. */
  readonly files: Readonly<Record<string, string>>;
  /** Files that the directory listing reports but whose reads fail, as a permission error would. */
  readonly unreadable?: readonly string[];
}

/** An in-memory `ContentFs` double. `reads` records every file read, in order. */
export interface MemoryContentFs extends ContentFs {
  readonly reads: string[];
}

export function memoryContentFs({ files, unreadable = [] }: MemoryContentFsOptions): MemoryContentFs {
  const reads: string[] = [];
  return {
    reads,
    async readFile(filePath) {
      reads.push(filePath);
      if (unreadable.includes(filePath)) throw new Error(`EACCES: ${filePath}`);
      const content = files[filePath];
      if (content === undefined) throw new Error(`ENOENT: ${filePath}`);
      return content;
    },
    async readDirectory(dirPath) {
      const prefix = dirPath.endsWith("/") ? dirPath : `${dirPath}/`;
      const entries = new Map<string, boolean>();
      for (const filePath of Object.keys(files)) {
        if (!filePath.startsWith(prefix)) continue;
        const [name, ...rest] = filePath.slice(prefix.length).split("/");
        if (name) entries.set(name, rest.length > 0);
      }
      if (entries.size === 0) throw new Error(`ENOENT: ${dirPath}`);
      return [...entries].map(([name, isDirectory]) => ({ name, isDirectory: () => isDirectory }));
    },
  };
}
