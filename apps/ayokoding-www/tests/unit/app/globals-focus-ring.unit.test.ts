import { readFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { describe, expect, it } from "vitest";

// UIW-001: keyboard focus on the shared Button primitive went invisible in
// the gated build because the `focus-visible:ring-[3px]` width utility was
// missing from the compiled app stylesheet (axe does not catch this class —
// the class was present in the DOM, the rule was absent from the CSS). These
// tests lock both
// ends of that contract: the explicit inline source that guarantees the three
// safety-critical focus utilities always compile, and the compiled output
// itself.
const GLOBALS_CSS = path.join(process.cwd(), "src/app/globals.css");

const FOCUS_INLINE_SOURCES = ["focus-visible:border-ring", "focus-visible:ring-[3px]", "focus-visible:ring-ring/50"];

describe("ayokoding-www Button focus-ring guard (UIW-001)", () => {
  it("pins the Button focus-ring utilities with an explicit inline source", () => {
    const css = readFileSync(GLOBALS_CSS, "utf8");

    for (const candidate of FOCUS_INLINE_SOURCES) {
      expect(css).toContain(`@source inline("${candidate}")`);
    }
  });

  it("emits a 3px focus-visible ring rule in the compiled stylesheet", async () => {
    const css = readFileSync(GLOBALS_CSS, "utf8");
    const result = await postcss([tailwindcss()]).process(css, { from: GLOBALS_CSS });

    const rule = result.css.match(/\.focus-visible\\:ring-\\\[3px\\\]\s*\{[^}]*\}/);
    expect(rule).not.toBeNull();
    // The ring shadow must carry a real 3px spread, not the 0-width default
    // the gate observed (`--tw-ring-shadow` staying `0 0 #0000`).
    expect(rule?.[0]).toContain("calc(3px");
  }, 60000);
});
