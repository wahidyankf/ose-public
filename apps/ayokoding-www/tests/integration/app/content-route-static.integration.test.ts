import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const contentPageSource = readFileSync(
  join(__dirname, "../../../src/app", "[locale]", "(content)", "[...slug]", "page.tsx"),
  "utf8",
);

describe("ayokoding-www content route remains statically renderable", () => {
  it("does not declare a searchParams prop", () => {
    expect(contentPageSource).not.toMatch(/\bsearchParams\s*:/);
  });

  it("does not await searchParams", () => {
    expect(contentPageSource).not.toMatch(/\bawait\s+searchParams\b/);
  });
});
