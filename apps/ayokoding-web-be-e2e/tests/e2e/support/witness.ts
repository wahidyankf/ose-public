// Real-corpus witnesses for the HTTP boundary. The routes are the witnesses recorded in
// evidence/P3-E2E/moved-scenario-verification.md. The text an assertion expects is read from the witness file itself,
// by rule, so no assertion copies a title, description, or sentence from the fixture.
import { readFileSync } from "node:fs";
import path from "node:path";

const contentRoot = path.resolve(__dirname, "../../../../ayokoding-www/content");

// lessonRoute is a published lesson of the real corpus. Lesson pages declare no description, so the
// description witness is courseRoute, whose course index declares one.
export const lessonRoute = "/en/learn/courses/just-enough-python/learning/beginner";
export const lessonFile = "en/learn/courses/just-enough-python/learning/beginner.md";

// courseRoute is a published course of the real corpus that declares a title and a description.
export const courseRoute = "/en/learn/courses/sql-essentials";
export const courseFile = "en/learn/courses/sql-essentials/_index.md";

// legacyRoute is a published legacy leaf of the real corpus. Section _index.md files serve no route.
export const legacyRoute = "/en/learn/legacy/software-engineering/overview";
export const legacyFile = "en/learn/legacy/software-engineering/overview.md";

function witnessText(relative: string): string {
  return readFileSync(path.join(contentRoot, relative), "utf8");
}

// frontmatterValue returns one top-level frontmatter field of a witness file.
function frontmatterValue(relative: string, key: string): string {
  const match = new RegExp(`^${key}:\\s*"?([^"\\n]+?)"?\\s*$`, "m").exec(witnessText(relative));
  if (!match) {
    throw new Error(`witness ${relative} declares no ${key}`);
  }
  return (match[1] ?? "").trim();
}

// frontmatterTitle returns the title a witness file declares.
export function frontmatterTitle(relative: string): string {
  return frontmatterValue(relative, "title");
}

// frontmatterDescription returns the description a witness file declares.
export function frontmatterDescription(relative: string): string {
  return frontmatterValue(relative, "description");
}

// firstHeadingHTML returns the first second-level heading of a witness file as the server writes it into HTML:
// the characters the Go renderer escapes are escaped the same way, so the assertion matches served bytes.
export function firstHeadingHTML(relative: string): string {
  const match = /^## (.+)$/m.exec(witnessText(relative));
  if (!match) {
    throw new Error(`witness ${relative} has no second-level heading`);
  }
  return (match[1] ?? "")
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&#34;")
    .replace(/'/g, "&#39;");
}
