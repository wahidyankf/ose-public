import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { findPaletteViolations } from "./validate-mermaid-palette.mjs";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "validate-mermaid-palette.mjs");
const PALETTE_DEFAULT = "    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF";

/**
 * @param {string[]} lines
 * @returns {string}
 */
const markdown = (lines) => lines.join("\n") + "\n";

test("accepts a flowchart that declares a complete default class", () => {
  const text = markdown(["# Doc", "", "```mermaid", "flowchart TB", "    A --> B", PALETTE_DEFAULT, "```"]);

  assert.deepEqual(findPaletteViolations("doc.md", text), []);
});

test("rejects a flowchart that leaves nodes on the theme colours", () => {
  const text = markdown(["# Doc", "", "```mermaid", "flowchart TB", "    A --> B", "```"]);

  assert.deepEqual(findPaletteViolations("doc.md", text), [
    "doc.md:3: flowchart diagram declares no classDef default setting fill, stroke, and color",
  ]);
});

test("rejects a graph whose only classes leave unclassed nodes on the theme colours", () => {
  const text = markdown([
    "```mermaid",
    "graph LR",
    "    A:::blue --> B",
    "    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF",
    "```",
  ]);

  assert.deepEqual(findPaletteViolations("doc.md", text), [
    "doc.md:1: graph diagram declares no classDef default setting fill, stroke, and color",
  ]);
});

test("rejects a default class that omits fill, stroke, or color", () => {
  const text = markdown(["```mermaid", "flowchart TB", "    A --> B", "    classDef default stroke:#000000", "```"]);

  assert.deepEqual(findPaletteViolations("doc.md", text), [
    "doc.md:1: flowchart diagram declares no classDef default setting fill, stroke, and color",
  ]);
});

test("finds the diagram type after front matter, init directives, and comments", () => {
  const text = markdown([
    "```mermaid",
    "---",
    "title: Example",
    "---",
    "%%{init: {'theme': 'base'}}%%",
    "%% palette: blue",
    "flowchart TB",
    "    A --> B",
    "```",
  ]);

  assert.deepEqual(findPaletteViolations("doc.md", text), [
    "doc.md:1: flowchart diagram declares no classDef default setting fill, stroke, and color",
  ]);
});

test("requires the default class in class, entity-relationship, and requirement diagrams", () => {
  const text = markdown([
    "```mermaid",
    "classDiagram",
    "    class Order",
    "```",
    "```mermaid",
    "erDiagram",
    "    ORDER ||--o{ LINE : has",
    "```",
    "```mermaid",
    "requirementDiagram",
    "    requirement r { id: 1 }",
    "```",
  ]);

  assert.deepEqual(findPaletteViolations("doc.md", text), [
    "doc.md:1: classDiagram diagram declares no classDef default setting fill, stroke, and color",
    "doc.md:5: erDiagram diagram declares no classDef default setting fill, stroke, and color",
    "doc.md:9: requirementDiagram diagram declares no classDef default setting fill, stroke, and color",
  ]);
});

test("ignores diagram types whose renderer does not apply a default class", () => {
  const types = ["sequenceDiagram", "stateDiagram-v2", "stateDiagram", "block-beta", "gitGraph", "timeline", "mindmap"];
  const text = markdown(types.flatMap((type) => ["```mermaid", type, "    A", "```"]));

  assert.deepEqual(findPaletteViolations("doc.md", text), []);
});

test("ignores a mermaid fence nested inside another code block", () => {
  const text = markdown(["````markdown", "```mermaid", "flowchart TB", "    A --> B", "```", "````"]);

  assert.deepEqual(findPaletteViolations("doc.md", text), []);
});

test("checks tilde fences and every diagram in the file", () => {
  const text = markdown([
    "~~~mermaid",
    "flowchart TB",
    "    A --> B",
    PALETTE_DEFAULT,
    "~~~",
    "",
    "```mermaid",
    "graph TD",
    "    C --> D",
    "```",
  ]);

  assert.deepEqual(findPaletteViolations("doc.md", text), [
    "doc.md:7: graph diagram declares no classDef default setting fill, stroke, and color",
  ]);
});

test("rejects an unterminated mermaid fence rather than skipping it", () => {
  const text = markdown(["```mermaid", "flowchart TB", "    A --> B"]);

  assert.deepEqual(findPaletteViolations("doc.md", text), [
    "doc.md:1: flowchart diagram declares no classDef default setting fill, stroke, and color",
  ]);
});

test("the command exits 1 with findings and 0 when every path complies", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "mermaid-palette-"));
  const bad = path.join(directory, "bad.md");
  const good = path.join(directory, "good.md");
  await writeFile(bad, markdown(["```mermaid", "flowchart TB", "    A --> B", "```"]));
  await writeFile(good, markdown(["```mermaid", "flowchart TB", "    A --> B", PALETTE_DEFAULT, "```"]));

  const failing = spawnSync(process.execPath, [script, good, bad], { encoding: "utf8" });
  assert.equal(failing.status, 1);
  assert.match(failing.stderr, /bad\.md:1: flowchart diagram declares no classDef default/u);

  const passing = spawnSync(process.execPath, [script, good], { encoding: "utf8" });
  assert.equal(passing.status, 0, passing.stderr);
});

test("the command skips paths that are not existing Markdown files", () => {
  const result = spawnSync(process.execPath, [script, "missing.md", "package.json"], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
});
