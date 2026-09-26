#!/usr/bin/env node
// Enforces the palette-default rule in
// repo-governance/conventions/formatting/diagrams/mermaid-color-accessibility-palette.md:
// every diagram of a type that applies `classDef default` declares one setting
// fill, stroke, and color, so no node renders in the Mermaid theme's colours.
// `./rhino md mermaid validate` checks only the colours a diagram declares and
// passes a diagram that declares none; whether the declared values come from
// the palette and meet contrast stays rhino's check.
//
// A mermaid fence nested inside another code block is illustrative source, not
// a rendered diagram, so it is skipped. An unterminated fence is still checked:
// skipping what cannot be closed would report a broken diagram as compliant.
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/**
 * Diagram types whose renderer applies `classDef default` to unclassed nodes.
 * State, block, sequence, gitGraph, timeline, and mindmap diagrams either lack
 * `classDef` or never apply a class named `default`, so requiring one there
 * would force a declaration the renderer ignores.
 */
export const REQUIRED_TYPES = ["flowchart", "graph", "classDiagram", "erDiagram", "requirementDiagram"];

const FENCE_OPEN = /^\s{0,3}(`{3,}|~{3,})\s*([^\s`]*)/u;
const DEFAULT_CLASS = /^\s*classDef\s+default\s+(.+)$/u;

/**
 * @param {string} line
 * @param {string} marker the opening fence run
 * @returns {boolean}
 */
const closes = (line, marker) => {
  const trimmed = line.trim();
  return trimmed.length >= marker.length && trimmed[0] === marker[0] && /^(`+|~+)$/u.test(trimmed);
};

/**
 * The first token of the first line that is not front matter, an init
 * directive, a comment, or blank.
 *
 * @param {string[]} body
 * @returns {string}
 */
const diagramType = (body) => {
  let index = 0;
  if (body[0]?.trim() === "---") {
    index = body.findIndex((line, position) => position > 0 && line.trim() === "---") + 1;
    if (index === 0) return "";
  }
  for (; index < body.length; index += 1) {
    const line = body[index].trim();
    if (line === "" || line.startsWith("%%")) continue;
    return line.split(/\s+/u)[0];
  }
  return "";
};

/**
 * @param {string[]} body
 * @returns {boolean}
 */
const hasCompleteDefault = (body) =>
  body.some((line) => {
    const declaration = DEFAULT_CLASS.exec(line)?.[1];
    if (declaration === undefined) return false;
    const properties = declaration.split(",").map((property) => property.split(":")[0].trim());
    return ["fill", "stroke", "color"].every((property) => properties.includes(property));
  });

/**
 * Lists every rendered diagram that would leave nodes on the theme colours.
 *
 * @param {string} name the path that prefixes each finding
 * @param {string} text the Markdown source
 * @returns {string[]} one message per violation, empty when every diagram complies
 */
export const findPaletteViolations = (name, text) => {
  const lines = text.split(/\r?\n/u);
  const violations = [];
  for (let index = 0; index < lines.length; index += 1) {
    const open = FENCE_OPEN.exec(lines[index]);
    if (open === null) continue;
    const [, marker, info] = open;
    let end = index + 1;
    while (end < lines.length && !closes(lines[end], marker)) end += 1;
    if (info === "mermaid") {
      const body = lines.slice(index + 1, end);
      const type = diagramType(body);
      if (REQUIRED_TYPES.includes(type) && !hasCompleteDefault(body)) {
        violations.push(
          `${name}:${index + 1}: ${type} diagram declares no classDef default setting fill, stroke, and color`,
        );
      }
    }
    index = end;
  }
  return violations;
};

/**
 * @param {string} candidate
 * @returns {Promise<boolean>}
 */
const isMarkdownFile = async (candidate) => {
  if (!candidate.endsWith(".md")) return false;
  try {
    return (await stat(candidate)).isFile();
  } catch {
    return false;
  }
};

const main = async () => {
  const violations = [];
  for (const candidate of process.argv.slice(2)) {
    if (!(await isMarkdownFile(candidate))) continue;
    violations.push(...findPaletteViolations(candidate, await readFile(candidate, "utf8")));
  }
  for (const violation of violations) console.error(violation);
  process.exitCode = violations.length === 0 ? 0 : 1;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
