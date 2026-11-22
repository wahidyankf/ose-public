import { describe, expect, it, vi } from "vitest";
import { runGenerateIndexes } from "../../../src/scripts/generate-indexes";
import type { IndexGeneratorPort } from "../../../src/features/content/shell/index-generator";
import type { ContentRepository } from "../../../src/features/content/core/repository";

// The generator's node port imports FileSystemContentRepository, whose module graph reads
// server-side env at import time — stub it; the tests supply their own repository port.
vi.mock("../../../src/features/content/shell/repository-fs", () => ({
  FileSystemContentRepository: class {},
}));

function entry(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    locale: "en",
    title: "T",
    weight: 100,
    isSection: false,
    draft: false,
    body: "",
    ...overrides,
  };
}

function portWith(entries: Record<string, unknown>[], written: { value: string }): IndexGeneratorPort {
  return {
    repository: { readAllContent: async () => entries } as unknown as ContentRepository,
    readText: async () => "---\ntitle: T\n---\n",
    writeText: async (_filePath: string, content: string) => {
      written.value = content;
    },
    now: () => new Date("2026-01-01T00:00:00Z"),
  };
}

function sectionEntries(): Record<string, unknown>[] {
  return [
    entry({ slug: "", isSection: true, filePath: "content/en/_index.md" }),
    entry({ slug: "overview", title: "Overview", filePath: "content/en/overview.md" }),
  ];
}

describe("runGenerateIndexes", () => {
  it("writes changed indexes in generate mode and exits zero", async () => {
    const written = { value: "" };
    const logs: string[] = [];
    const exitCode = await runGenerateIndexes({
      contentDir: "content",
      mode: "generate",
      port: portWith(sectionEntries(), written),
      log: (message) => logs.push(message),
      errorLog: () => undefined,
    });
    expect(exitCode).toBe(0);
    expect(written.value).toContain("[Overview]");
    expect(logs.some((line) => line.includes("Updated"))).toBe(true);
  });

  it("reports stale indexes in validate mode and exits one without writing", async () => {
    const written = { value: "" };
    const errors: string[] = [];
    const exitCode = await runGenerateIndexes({
      contentDir: "content",
      mode: "validate",
      port: portWith(sectionEntries(), written),
      log: () => undefined,
      errorLog: (message) => errors.push(message),
    });
    expect(exitCode).toBe(1);
    expect(written.value).toBe("");
    expect(errors.some((line) => line.includes("out of date"))).toBe(true);
  });

  it("reports per-section failures and still exits zero", async () => {
    const errors: string[] = [];
    const port = portWith(sectionEntries(), { value: "" });
    const failing = {
      ...port,
      readText: async () => {
        throw new Error("unreadable");
      },
    };
    const exitCode = await runGenerateIndexes({
      contentDir: "content",
      mode: "generate",
      port: failing,
      log: () => undefined,
      errorLog: (message) => errors.push(message),
    });
    expect(exitCode).toBe(0);
    expect(errors[0]).toBe("Errors:");
  });
});
