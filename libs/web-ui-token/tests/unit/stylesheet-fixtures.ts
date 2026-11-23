// In-memory stand-ins for src/tokens.css and src/organiclever.css. The unit bindings read these strings through
// the stylesheet seam in tokens-export.steps.ts; the real files are read on disk by tests/integration.
import { colorTokens } from "../../src/colors";

const HUES = ["terracotta", "honey", "sage", "teal", "sky", "plum"];

export const TOKENS_CSS = [
  '@custom-variant dark (&:is([data-theme="dark"] *), &:is(.dark *));',
  ":root {",
  "  --radius: 0.5rem;",
  "  --color-background: #ffffff;",
  "  --color-muted: #f4f4f5;",
  "  --color-destructive: #dc2626;",
  ...Object.values(colorTokens).map((name) => `  ${name}: #808080;`),
  "}",
  ".dark {",
  "  --color-background: #09090b;",
  "}",
].join("\n");

export const ORGANICLEVER_CSS = [
  ":root {",
  ...HUES.flatMap((hue) => [
    `  --hue-${hue}: #000000;`,
    `  --hue-${hue}-ink: #000000;`,
    `  --hue-${hue}-wash: #000000;`,
  ]),
  "  --warm-0: #ffffff;",
  "  --warm-100: #faf7f2;",
  "  --warm-200: #efe9de;",
  "  --color-primary: var(--hue-sage);",
  "}",
].join("\n");
