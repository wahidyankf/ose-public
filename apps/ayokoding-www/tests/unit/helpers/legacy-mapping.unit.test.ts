import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import {
  checkLegacyMapping,
  collectPlanLegacyDiff,
  findMappingFile,
  formatMappingReport,
  parseMappingRows,
  parseStatusPorcelain,
} from "./legacy-mapping";

const execFileAsync = promisify(execFile);

const SAMPLE_TABLE = [
  "| Legacy path | Files | Words | Disposition | Target | Evidence |",
  "| --- | --- | --- | --- | --- | --- |",
  "| `topic/one` | 3 | 1,000 | covered | `course-a, course-b` | Existing course teaches it. |",
  "| `topic/two` | 1 | 200 | new | `course-c` | No course teaches it. |",
  "| `topic/old.md` | 1 | 50 | obsolete | - | Bare navigation page. |",
  "",
].join("\n");

describe("parseMappingRows", () => {
  it("parses six-column rows and skips the header and separator", () => {
    const rows = parseMappingRows(SAMPLE_TABLE);
    expect(rows.map((r) => r.legacyPath)).toEqual(["topic/one", "topic/two", "topic/old.md"]);
    expect(rows[0]).toMatchObject({ files: 3, words: 1000, disposition: "covered", target: "course-a, course-b" });
    expect(rows[2]).toMatchObject({ disposition: "obsolete", target: "-" });
  });

  it("rejects an unknown Disposition", () => {
    expect(() => parseMappingRows("| `x` | 1 | 1 | moved | `y` | Why. |\n")).toThrow("unknown Disposition");
  });
});

describe("bucket rows", () => {
  const table = [
    "| Legacy path | Files | Words | Disposition | Target | Evidence |",
    "| --- | --- | --- | --- | --- | --- |",
    "| `topic/one` | 1 | 10 | covered | `course-a` | Teaches it. |",
    "| (2 pure navigation `_index.md`/`overview.md` files, listed elsewhere) | 2 | 3 | obsolete | - | Shells. |",
    "",
  ].join("\n");

  it("claims leftover index shells without double-counting topic files", () => {
    const rows = parseMappingRows(table);
    expect(rows).toHaveLength(2);
    const report = checkLegacyMapping(
      ["topic/one/a.md", "topic/one/overview.md", "other/_index.md", "other/deep.md"],
      rows,
      () => true,
    );
    // topic/one/overview.md stays with its topic row; other/_index.md falls
    // to the bucket; other/deep.md matches nothing.
    expect(report.multiMatched).toEqual([]);
    expect(report.unmatched).toEqual(["other/deep.md"]);
    expect(formatMappingReport(report)).toContain("unmatched legacy file: other/deep.md");
  });
});

describe("checkLegacyMapping", () => {
  const rows = parseMappingRows(SAMPLE_TABLE);
  const firstRow = rows[0];
  const thirdRow = rows[2];
  if (firstRow === undefined || thirdRow === undefined) throw new Error("SAMPLE_TABLE must parse to 3 rows");
  const exists = (slug: string) => ["course-a", "course-b", "course-c"].includes(slug);

  it("is clean when every file matches exactly one row with real targets", () => {
    const report = checkLegacyMapping(["topic/one/a.md", "topic/two/b.md", "topic/old.md"], rows, exists);
    expect(formatMappingReport(report)).toBe("");
  });

  it("names unmatched files, double-matched files, and dangling targets", () => {
    const report = checkLegacyMapping(
      ["topic/one/a.md", "topic/nowhere/a.md"],
      [...rows, { ...firstRow, target: "course-a, ghost-course" }],
      exists,
    );
    expect(report.unmatched).toEqual(["topic/nowhere/a.md"]);
    expect(report.multiMatched).toEqual(["topic/one/a.md"]);
    expect(report.badTargets).toEqual(["topic/one -> ghost-course"]);
    expect(formatMappingReport(report)).toContain("unmatched legacy file: topic/nowhere/a.md");
  });

  it("requires a dash target for obsolete rows", () => {
    const report = checkLegacyMapping(["topic/old.md"], [{ ...thirdRow, target: "course-a" }], exists);
    expect(report.badTargets).toEqual(["topic/old.md"]);
  });
});

describe("parseStatusPorcelain", () => {
  it("takes the new path of renames and skips blank lines", () => {
    expect(parseStatusPorcelain(" M apps/a.md\n?? apps/b.md\nR  apps/o.md -> apps/n.md\n")).toEqual([
      "apps/a.md",
      "apps/b.md",
      "apps/n.md",
    ]);
  });
});

describe("findMappingFile", () => {
  it("finds the single mapping file across plan areas", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "mapping-find-"));
    const dir = path.join(root, "plans", "in-progress", "demo", "syllabus");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "legacy-to-course-mapping.md"), "# map\n");
    await expect(findMappingFile(root)).resolves.toBe(path.join(dir, "legacy-to-course-mapping.md"));
    await fs.rm(root, { recursive: true, force: true });
  });

  it("fails when no mapping file exists", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "mapping-none-"));
    await expect(findMappingFile(root)).rejects.toThrow("exactly one");
    await fs.rm(root, { recursive: true, force: true });
  });
});

describe("collectPlanLegacyDiff", () => {
  it("lists committed and uncommitted legacy-path changes only", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "mapping-diff-"));
    await execFileAsync("git", ["init", "-b", "main"], { cwd: root });
    await execFileAsync("git", ["config", "user.email", "t@t.t"], { cwd: root });
    await execFileAsync("git", ["config", "user.name", "t"], { cwd: root });
    await execFileAsync("git", ["commit", "--allow-empty", "-m", "base"], { cwd: root });
    await execFileAsync("git", ["checkout", "-b", "plan"], { cwd: root });
    const legacy = path.join(root, "apps/ayokoding-www/content/en/learn/legacy/t.md");
    await fs.mkdir(path.dirname(legacy), { recursive: true });
    await fs.writeFile(legacy, "hi\n");
    await execFileAsync("git", ["add", "."], { cwd: root });
    await execFileAsync("git", ["commit", "-m", "touch legacy"], { cwd: root });
    await fs.writeFile(path.join(root, "other.md"), "x\n");
    const diff = await collectPlanLegacyDiff(root);
    expect(diff).toEqual(["apps/ayokoding-www/content/en/learn/legacy/t.md"]);
    await fs.rm(root, { recursive: true, force: true });
  });
});
