// @scenario specs/libs/web-ui-token/behaviours/tokens/tokens-export.feature: The package exports every structural token module
// @scenario specs/libs/web-ui-token/behaviours/tokens/tokens-export.feature: Importing tokens.css defines the structural radius, neutral, muted, and destructive tokens
// @scenario specs/libs/web-ui-token/behaviours/tokens/tokens-export.feature: The dark class or data-theme dark switches the neutral palette
// @scenario specs/libs/web-ui-token/behaviours/tokens/tokens-export.feature: Importing organiclever.css activates the warm palette
// @scenario specs/libs/web-ui-token/behaviours/tokens/tokens-export.feature: Each colorTokens name is a custom property defined by tokens.css
// @scenario specs/libs/web-ui-token/behaviours/tokens/tokens-export.feature: The radius, spacing, and typography values match the documented scales
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { colorTokens } from "../../src/colors";
import { radius } from "../../src/radius";
import { spacing } from "../../src/spacing";
import { typography } from "../../src/typography";

const PACKAGE_ROOT = path.resolve(__dirname, "../..");
const HUES = ["terracotta", "honey", "sage", "teal", "sky", "plum"];
const SPACING_STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
const DARK_VARIANT = '@custom-variant dark (&:is([data-theme="dark"] *), &:is(.dark *));';

/** Reads a stylesheet from the package's src directory on disk. */
function readStylesheet(name: string): string {
  return readFileSync(path.join(PACKAGE_ROOT, "src", name), "utf8");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function declares(css: string, name: string): boolean {
  return new RegExp(`^\\s*${escapeRegExp(name)}:`, "m").test(css);
}

function declaredValue(css: string, name: string, from = 0): string | undefined {
  const match = new RegExp(`^\\s*${escapeRegExp(name)}:\\s*([^;]+);`, "m").exec(css.slice(from));
  return match?.[1].trim();
}

const tokensCss = readStylesheet("tokens.css");

describe("tokens.css and the package entry, read from disk", () => {
  it("The package exports every structural token module", async () => {
    const manifest = JSON.parse(readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8")) as { main: string };
    const entry = (await import(path.join(PACKAGE_ROOT, manifest.main))) as Record<string, unknown>;
    expect(entry.colorTokens).toBeDefined();
    expect(entry.radius).toBeDefined();
    expect(entry.spacing).toBeDefined();
    expect(entry.typography).toBeDefined();
  });

  it("Importing tokens.css defines the structural radius, neutral, muted, and destructive tokens", () => {
    expect(declares(tokensCss, "--radius")).toBe(true);
    expect(declares(tokensCss, "--color-background")).toBe(true);
    expect(declares(tokensCss, "--color-muted")).toBe(true);
    expect(declares(tokensCss, "--color-destructive")).toBe(true);
  });

  it("The dark class or data-theme dark switches the neutral palette", () => {
    expect(tokensCss).toContain(DARK_VARIANT);
    const darkStart = tokensCss.indexOf(".dark {");
    expect(darkStart).toBeGreaterThanOrEqual(0);
    const lightValue = declaredValue(tokensCss, "--color-background");
    const darkValue = declaredValue(tokensCss, "--color-background", darkStart);
    expect(darkValue).toBeDefined();
    expect(darkValue).not.toBe(lightValue);
  });

  it("Importing organiclever.css activates the warm palette", () => {
    const organicleverCss = readStylesheet("organiclever.css");
    for (const hue of HUES) {
      expect(declares(organicleverCss, `--hue-${hue}`)).toBe(true);
      expect(declares(organicleverCss, `--hue-${hue}-ink`)).toBe(true);
      expect(declares(organicleverCss, `--hue-${hue}-wash`)).toBe(true);
    }
    for (const step of ["--warm-0", "--warm-100", "--warm-200"]) {
      expect(declares(organicleverCss, step)).toBe(true);
    }
    expect(declaredValue(organicleverCss, "--color-primary")).toBe("var(--hue-sage)");
  });

  it("Each colorTokens name is a custom property defined by tokens.css", () => {
    for (const name of Object.values(colorTokens)) {
      expect(declares(tokensCss, name)).toBe(true);
    }
  });

  it("The radius, spacing, and typography values match the documented scales", () => {
    expect(radius.DEFAULT).toBe("0.5rem");
    expect(declaredValue(tokensCss, "--radius")).toBe("0.5rem");
    for (const step of SPACING_STEPS) {
      expect(spacing[step as keyof typeof spacing]).toBe(`${step / 4}rem`);
    }
    expect(Object.keys(typography)).toHaveLength(8);
  });
});
