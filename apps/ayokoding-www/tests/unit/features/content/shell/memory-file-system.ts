/**
 * In-memory file-system double for the content shell's ports. A file is a key in `files` holding its
 * text or its bytes; a directory is any path that is a key prefix of some file. Errors mirror
 * `node:fs`: a missing path throws ENOENT, and reading a directory as a file throws EISDIR.
 */
export interface MemoryDirent {
  name: string;
  isDirectory(): boolean;
  isFile(): boolean;
}

export interface MemoryFileSystem {
  readdir(dir: string): Promise<MemoryDirent[]>;
  readFile(filePath: string): Promise<string>;
  readBytes(filePath: string): Promise<Uint8Array>;
}

function fsError(code: "ENOENT" | "EISDIR", target: string): Error {
  return Object.assign(new Error(`${code}: ${target}`), { code });
}

export function memoryFileSystem(files: Record<string, string | Uint8Array>): MemoryFileSystem {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8");
  const isDirectory = (target: string): boolean => Object.keys(files).some((key) => key.startsWith(`${target}/`));

  const contentOf = (target: string): string | Uint8Array => {
    const content = files[target];
    if (content !== undefined) return content;
    throw fsError(isDirectory(target) ? "EISDIR" : "ENOENT", target);
  };

  return {
    async readdir(dir) {
      const prefix = `${dir}/`;
      const entries = new Map<string, boolean>();
      for (const key of Object.keys(files)) {
        if (!key.startsWith(prefix)) continue;
        const [head, ...rest] = key.slice(prefix.length).split("/");
        if (head === undefined) continue;
        entries.set(head, entries.get(head) === true || rest.length > 0);
      }
      if (entries.size === 0) throw fsError("ENOENT", dir);
      return [...entries].map(([name, directory]) => ({
        name,
        isDirectory: () => directory,
        isFile: () => !directory,
      }));
    },
    async readFile(filePath) {
      const content = contentOf(filePath);
      return typeof content === "string" ? content : decoder.decode(content);
    },
    async readBytes(filePath) {
      const content = contentOf(filePath);
      return typeof content === "string" ? encoder.encode(content) : content;
    },
  };
}
