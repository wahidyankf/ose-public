import { describe, expect, it, vi } from "vitest";
import { nodeContentFs } from "@/features/content/shell/content-fs";

// The real adapter wraps node:fs/promises. The module is replaced by a double here, so the wrapper is
// exercised without touching the disk; the integration run reads the real disk through the same adapter.
const disk = vi.hoisted(() => ({
  readFile: vi.fn<(path: string, encoding: string) => Promise<string>>(),
  readdir: vi.fn<(path: string, options: { withFileTypes: boolean }) => Promise<unknown[]>>(),
}));

vi.mock("node:fs/promises", () => ({ default: disk }));

describe("node content file system adapter", () => {
  it("reads a file as UTF-8 text", async () => {
    disk.readFile.mockResolvedValueOnce("# About");

    await expect(nodeContentFs.readFile("/content/about.md")).resolves.toBe("# About");
    expect(disk.readFile).toHaveBeenCalledWith("/content/about.md", "utf-8");
  });

  it("lists a directory with entry types", async () => {
    const entries = [{ name: "updates", isDirectory: () => true }];
    disk.readdir.mockResolvedValueOnce(entries);

    await expect(nodeContentFs.readDirectory("/content")).resolves.toBe(entries);
    expect(disk.readdir).toHaveBeenCalledWith("/content", { withFileTypes: true });
  });
});
