import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadManifests,
  type ManifestFileSystem,
} from "../../../../../src/features/course-paths/shell/manifest-repository";

// In-memory file-system double: a map of absolute paths to file text. A directory is any path that
// is a key prefix of some file. Missing directories throw, as `fs.readdir` does.
function memoryFileSystem(files: Record<string, string>): ManifestFileSystem {
  return {
    async readdir(dir) {
      const prefix = dir.endsWith("/") ? dir : `${dir}/`;
      const names = new Set<string>();
      const dirs = new Set<string>();
      for (const filePath of Object.keys(files)) {
        if (!filePath.startsWith(prefix)) continue;
        const [head, ...rest] = filePath.slice(prefix.length).split("/");
        if (head === undefined) continue;
        names.add(head);
        if (rest.length > 0) dirs.add(head);
      }
      if (names.size === 0) throw new Error(`ENOENT: ${dir}`);
      return [...names].map((name) => ({ name, isDirectory: () => dirs.has(name) }));
    },
    async readFile(filePath) {
      const text = files[filePath];
      if (text === undefined) throw new Error(`ENOENT: ${filePath}`);
      return text;
    },
  };
}

const ROOT = "/manifests";
const LIBRARY = ["just-enough-python", "capstone-forge-ready"];

// A manifest literal in the shape the upstream schema accepts (the fixture helper adds keys it rejects).
function manifestText(courses: readonly string[] = LIBRARY): string {
  return JSON.stringify({
    pathId: "careers/interview-ready/software-engineer",
    arc: "interview-ready",
    title: "Interview-Ready Software Engineer",
    description: "Interview-first track for an experienced engineer re-entering the market.",
    phases: [
      {
        id: "foundations",
        title: "Foundations",
        kind: "core",
        outcome: { can: "start" },
        courses,
      },
    ],
  });
}

describe("loadManifests (in-memory file system)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads a valid manifest and validates it through the upstream schema", async () => {
    const io = memoryFileSystem({ [`${ROOT}/skills/python.json`]: manifestText() });

    const manifests = await loadManifests(ROOT, LIBRARY, io);

    expect(manifests).toHaveLength(1);
    expect(manifests[0]?.courseOrder).toEqual(LIBRARY);
  });

  it("walks nested directories and ignores non-JSON files", async () => {
    const io = memoryFileSystem({
      [`${ROOT}/careers/arc/role.json`]: manifestText(),
      [`${ROOT}/README.md`]: "not a manifest",
    });

    const manifests = await loadManifests(ROOT, LIBRARY, io);

    expect(manifests).toHaveLength(1);
  });

  it("returns an empty array when the manifests directory does not exist", async () => {
    const io = memoryFileSystem({});

    await expect(loadManifests(ROOT, LIBRARY, io)).resolves.toEqual([]);
  });

  it("skips a manifest whose courseOrder names an unresolvable course, with a logged warning", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const io = memoryFileSystem({
      [`${ROOT}/skills/ok.json`]: manifestText(),
      [`${ROOT}/skills/unknown.json`]: manifestText(["just-enough-python", "does-not-exist-anywhere"]),
    });

    const manifests = await loadManifests(ROOT, LIBRARY, io);

    expect(manifests).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("does-not-exist-anywhere"));
  });

  it("skips a manifest that fails the schema, naming the file in the warning", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const io = memoryFileSystem({ [`${ROOT}/skills/broken.json`]: "{}" });

    const manifests = await loadManifests(ROOT, LIBRARY, io);

    expect(manifests).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("skills/broken.json"));
  });

  it("skips a file whose JSON does not parse and still loads its valid siblings", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const io = memoryFileSystem({
      [`${ROOT}/skills/bad.json`]: "{ not json",
      [`${ROOT}/skills/good.json`]: manifestText(),
    });

    const manifests = await loadManifests(ROOT, LIBRARY, io);

    expect(manifests).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("returns an empty array for a directory whose only entries are not manifests", async () => {
    const io = memoryFileSystem({ [`${ROOT}/notes.txt`]: "x" });

    await expect(loadManifests(ROOT, LIBRARY, io)).resolves.toEqual([]);
  });
});
