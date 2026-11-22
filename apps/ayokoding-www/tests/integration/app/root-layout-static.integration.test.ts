import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appDirectory = resolve(__dirname, "../../../src/app");
const rootLayoutPath = join(appDirectory, "layout.tsx");
const rootPagePath = join(appDirectory, "page.tsx");
const entryLayoutPath = join(appDirectory, "(entry)", "layout.tsx");
const entryPagePath = join(appDirectory, "(entry)", "page.tsx");
const layoutPaths = readdirSync(appDirectory, { recursive: true })
  .filter((path): path is string => typeof path === "string" && path.endsWith("layout.tsx"))
  .map((path) => join(appDirectory, path));
const dynamicApiPattern = /\b(?:headers|cookies|draftMode|connection|noStore)\s*\(/;

describe("ayokoding-www layouts remain statically renderable", () => {
  it("does not retain a root app layout", () => {
    expect(existsSync(rootLayoutPath)).toBe(false);
  });

  it("gives the unlocalized entry route its own static root layout", () => {
    expect(existsSync(rootPagePath)).toBe(false);
    expect(existsSync(entryPagePath)).toBe(true);
    expect(existsSync(entryLayoutPath)).toBe(true);

    const entryLayoutSource = readFileSync(entryLayoutPath, "utf8");
    expect(entryLayoutSource).toContain('<html lang="en">');
    expect(entryLayoutSource).toContain("<body");
  });

  it("does not read a Next.js dynamic API from any layout", () => {
    const dynamicLayouts = layoutPaths.filter((layoutPath) => dynamicApiPattern.test(readFileSync(layoutPath, "utf8")));

    expect(dynamicLayouts).toEqual([]);
  });
});
