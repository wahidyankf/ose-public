import { describe, it, expect } from "vitest";
import * as primitives from "../../../src/primitives/index";

/**
 * The primitives sub-barrel (`src/primitives/index.ts`, resolved by consuming apps via the
 * `@open-sharia-enterprise/web-ui/primitives` path in `tsconfig.base.json`) is never imported by a
 * primitive test, since every primitive test imports its subject file directly. Mirrors
 * `tests/unit/index.test.ts` for the top-level barrel.
 */
describe("web-ui primitives package exports", () => {
  // @scenario specs/libs/web-ui/behaviours/primitives/primitives-entry.feature: Consumers import the base Badge, Button, Card, Dialog, and Sheet plus CodeBlock, CopyButton, and ResizablePanel from the primitives entry
  it("exports every primitive", () => {
    expect(primitives.Badge).toBeDefined();
    expect(primitives.Button).toBeDefined();
    expect(primitives.Card).toBeDefined();
    expect(primitives.CodeBlock).toBeDefined();
    expect(primitives.CopyButton).toBeDefined();
    expect(primitives.Command).toBeDefined();
    expect(primitives.Dialog).toBeDefined();
    expect(primitives.DropdownMenu).toBeDefined();
    expect(primitives.ResizablePanel).toBeDefined();
    expect(primitives.parsePersistedWidth).toBeDefined();
    expect(primitives.ScrollArea).toBeDefined();
    expect(primitives.Separator).toBeDefined();
    expect(primitives.Sheet).toBeDefined();
    expect(primitives.Tabs).toBeDefined();
    expect(primitives.Table).toBeDefined();
    expect(primitives.Tooltip).toBeDefined();
  });
});
