import { execFile } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const LEGACY_PREFIX = "apps/ayokoding-www/content/en/learn/legacy/";
export const MAPPING_FILENAME = "syllabus/legacy-to-course-mapping.md";

export interface MappingRow {
  legacyPath: string;
  files: number;
  words: number;
  disposition: "covered" | "new" | "obsolete";
  target: string;
  evidence: string;
}

export interface MappingReport {
  unmatched: string[];
  multiMatched: string[];
  badDisposition: string[];
  badTargets: string[];
}

function splitTableLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inBackticks = false;
  let escaped = false;
  for (const char of line.trim().replace(/^\||\|$/g, "")) {
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === "`") {
      inBackticks = !inBackticks;
      current += char;
    } else if (char === "|" && !inBackticks) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

const VALID_DISPOSITIONS = ["covered", "new", "obsolete"] as const;

export function parseMappingRows(markdown: string): MappingRow[] {
  const rows: MappingRow[] = [];
  for (const line of markdown.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = splitTableLine(line);
    if (cells.length !== 6) continue;
    if (cells.every((c) => /^:?-{3,}:?$/.test(c))) continue;
    const [rawPath = "", rawFiles = "", rawWords = "", rawDisposition = "", rawTarget = "", rawEvidence = ""] = cells;
    if (rawPath === "Legacy path") continue;
    const disposition = rawDisposition.replace(/`/g, "");
    if (!(VALID_DISPOSITIONS as readonly string[]).includes(disposition)) {
      throw new Error(`mapping row has unknown Disposition: ${rawDisposition}`);
    }
    rows.push({
      // Bucket rows (parenthetical, not a path) keep their raw text so the
      // matcher can read the file names they enumerate.
      legacyPath: rawPath.startsWith("(") ? rawPath : rawPath.replace(/`/g, ""),
      files: Number(rawFiles.replace(/,/g, "")),
      words: Number(rawWords.replace(/,/g, "")),
      disposition: disposition as MappingRow["disposition"],
      target: rawTarget.replace(/`/g, ""),
      evidence: rawEvidence,
    });
  }
  return rows;
}

function rowCovers(row: MappingRow, file: string): boolean {
  if (row.legacyPath.endsWith(".md")) return file === row.legacyPath;
  return file === row.legacyPath || file.startsWith(row.legacyPath + "/");
}

// A row whose Legacy path is a parenthetical description (not a path) is the
// mapping's named bucket for pure navigation shells: it claims the backticked
// file names it enumerates, but only for files no path row covers, so the
// "exactly one row" rule keeps holding.
export function bucketFileNames(row: MappingRow): string[] | null {
  if (!row.legacyPath.startsWith("(")) return null;
  const names: string[] = [];
  for (const m of row.legacyPath.matchAll(/`([^`]+)`/g)) {
    const name = m[1];
    if (name === undefined || !name.endsWith(".md")) continue;
    names.push(name.includes("/") ? name.slice(name.lastIndexOf("/") + 1) : name);
  }
  return names.length > 0 ? names : null;
}

export function checkLegacyMapping(
  legacyFiles: string[],
  rows: MappingRow[],
  courseExists: (slug: string) => boolean,
): MappingReport {
  const report: MappingReport = { unmatched: [], multiMatched: [], badDisposition: [], badTargets: [] };
  const buckets = rows.filter((r) => bucketFileNames(r) !== null);
  const pathRows = rows.filter((r) => bucketFileNames(r) === null);
  for (const file of legacyFiles) {
    const hits = pathRows.filter((r) => rowCovers(r, file));
    if (hits.length === 0) {
      const base = file.includes("/") ? file.slice(file.lastIndexOf("/") + 1) : file;
      const claimed = buckets.some((b) => bucketFileNames(b)!.includes(base));
      if (!claimed) report.unmatched.push(file);
    } else if (hits.length > 1) {
      report.multiMatched.push(file);
    }
  }
  for (const row of rows) {
    if (!(VALID_DISPOSITIONS as readonly string[]).includes(row.disposition)) {
      report.badDisposition.push(row.legacyPath);
      continue;
    }
    if (row.disposition === "obsolete") {
      if (row.target !== "-") report.badTargets.push(row.legacyPath);
      continue;
    }
    for (const slug of row.target.split(",").map((s) => s.trim())) {
      if (slug === "" || !courseExists(slug)) report.badTargets.push(`${row.legacyPath} -> ${slug}`);
    }
  }
  return report;
}

export function formatMappingReport(report: MappingReport): string {
  const lines: string[] = [];
  for (const f of report.unmatched) lines.push(`unmatched legacy file: ${f}`);
  for (const f of report.multiMatched) lines.push(`legacy file matched by more than one row: ${f}`);
  for (const r of report.badDisposition) lines.push(`row has unknown Disposition: ${r}`);
  for (const t of report.badTargets) lines.push(`row target resolves to no course: ${t}`);
  return lines.join("\n");
}

export function parseStatusPorcelain(output: string): string[] {
  const files: string[] = [];
  for (const line of output.split("\n")) {
    if (line.length < 4) continue;
    const rest = line.slice(3);
    const arrow = rest.indexOf(" -> ");
    files.push(arrow >= 0 ? rest.slice(arrow + 4) : rest);
  }
  return files;
}

export async function findMappingFile(repoRoot: string): Promise<string> {
  const hits: string[] = [];
  for (const area of ["plans/in-progress", "plans/done"]) {
    const areaDir = path.join(repoRoot, area);
    let plans: string[];
    try {
      plans = await fs.readdir(areaDir);
    } catch {
      continue;
    }
    for (const plan of plans) {
      const candidate = path.join(areaDir, plan, MAPPING_FILENAME);
      try {
        await fs.stat(candidate);
        hits.push(candidate);
      } catch {
        /* not this plan */
      }
    }
  }
  const [only] = hits;
  if (hits.length !== 1 || only === undefined) {
    throw new Error(`expected exactly one ${MAPPING_FILENAME}, found ${hits.length}`);
  }
  return only;
}

async function mergeBase(cwd: string): Promise<string> {
  for (const ref of ["origin/main", "main"]) {
    try {
      const { stdout } = await execFileAsync("git", ["merge-base", "HEAD", ref], { cwd });
      return stdout.trim();
    } catch {
      /* try the next ref */
    }
  }
  throw new Error("cannot find a merge base with origin/main or main");
}

export async function collectPlanLegacyDiff(repoRoot: string): Promise<string[]> {
  const base = await mergeBase(repoRoot);
  const { stdout: committed } = await execFileAsync("git", ["diff", "--name-only", `${base}...HEAD`], {
    cwd: repoRoot,
  });
  const { stdout: status } = await execFileAsync("git", ["status", "--porcelain"], { cwd: repoRoot });
  return [...committed.split("\n"), ...parseStatusPorcelain(status)]
    .map((f) => f.trim())
    .filter((f) => f.startsWith(LEGACY_PREFIX));
}
