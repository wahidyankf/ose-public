// Real-corpus witnesses for the browser boundary. Each finder reads the content of apps/ayokoding-www by a rule, so
// no step copies a course, lesson, or path title from the fixture. The finders sort their candidates, so a Given and
// its When always resolve the same page.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const wwwRoot = path.resolve(__dirname, "../../../../ayokoding-www");
const contentRoot = path.join(wwwRoot, "content");
const coursesRoot = path.join(contentRoot, "en/learn/courses");
const manifestRoot = path.join(wwwRoot, "src/features/course-paths/manifests");

export type CourseIndex = {
  slug: string;
  route: string;
  title: string;
  description: string;
  category: string;
  status: string;
  prerequisites: string[];
};

export type LearningPage = {
  course: string;
  slug: string;
  kind: string;
  route: string;
  title: string;
  weight: number;
  text: string;
};

export type PathWitness = {
  id: string;
  route: string;
  title: string;
  phases: string[][];
  courses: string[];
};

function frontmatterOf(text: string): string {
  const match = /^---\n([\s\S]*?)\n---/.exec(text);
  return match?.[1] ?? "";
}

function fieldOf(frontmatter: string, key: string): string {
  const value = new RegExp(`^${key}:[ \\t]*(.*)$`, "m").exec(frontmatter)?.[1] ?? "";
  return value.trim().replace(/^"(.*)"$/, "$1");
}

function isPublished(text: string): boolean {
  return /^draft:\s*false\s*$/m.test(frontmatterOf(text));
}

function markdownFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...markdownFiles(full));
    } else if (entry.endsWith(".md")) {
      found.push(full);
    }
  }
  return found.sort();
}

function slugList(value: string): string[] {
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((item) => item.trim().replace(/^"(.*)"$/, "$1"))
    .filter((item) => item.length > 0);
}

let courseIndexesCache: CourseIndex[] | undefined;
let learningCache: LearningPage[] | undefined;
let coursePagesCache: LearningPage[] | undefined;

// courseIndexes lists the published course index pages in slug order.
export function courseIndexes(): CourseIndex[] {
  if (courseIndexesCache === undefined) {
    courseIndexesCache = [];
    for (const entry of readdirSync(coursesRoot).sort()) {
      const file = path.join(coursesRoot, entry, "_index.md");
      let text: string;
      try {
        text = readFileSync(file, "utf8");
      } catch {
        continue;
      }
      if (!isPublished(text)) continue;
      const fm = frontmatterOf(text);
      courseIndexesCache.push({
        slug: entry,
        route: `/en/learn/courses/${entry}`,
        title: fieldOf(fm, "title"),
        description: fieldOf(fm, "description"),
        category: fieldOf(fm, "category"),
        status: fieldOf(fm, "status"),
        prerequisites: slugList(fieldOf(fm, "prerequisites")),
      });
    }
  }
  return courseIndexesCache;
}

// coursePages lists every published top-level course page (learning, drilling, and the rest), in course and slug order.
export function coursePages(): LearningPage[] {
  if (coursePagesCache === undefined) {
    coursePagesCache = [];
    for (const file of markdownFiles(coursesRoot)) {
      const parts = path.relative(coursesRoot, file).split(path.sep);
      const [course = "", kind = "", leaf = ""] = parts;
      // Overview files map to track routes that do not serve every course, so
      // they are not stable witnesses; only named lessons are candidates.
      if (parts.length !== 3 || leaf === "_index.md" || leaf === "overview.md") continue;
      const text = readFileSync(file, "utf8");
      if (!isPublished(text)) continue;
      const fm = frontmatterOf(text);
      const slug = leaf.replace(/\.md$/, "");
      coursePagesCache.push({
        course,
        slug,
        kind,
        route: `/en/learn/courses/${course}/${kind}/${slug}`,
        title: fieldOf(fm, "title"),
        weight: Number(fieldOf(fm, "weight") || 0),
        text,
      });
    }
  }
  return coursePagesCache;
}

// learningPages lists the published learning pages, in course, weight, and slug order.
// servedLearnPages lists every published page under the English learn tree
// (courses and legacy), so a search result can be compared with its own title.
let servedLearnCache: LearningPage[] | undefined;
export function servedLearnPages(): LearningPage[] {
  if (servedLearnCache === undefined) {
    servedLearnCache = [];
    const learnRoot = path.join(contentRoot, "en/learn");
    for (const file of markdownFiles(learnRoot)) {
      const relative = path.relative(learnRoot, file).split(path.sep);
      if (relative[relative.length - 1] === "_index.md" || relative[relative.length - 1] === "overview.md") continue;
      // Course lessons are served at course/kind/slug only; deeper course paths answer 404.
      if (relative[0] === "courses" && relative.length !== 4) continue;
      const text = readFileSync(file, "utf8");
      if (!isPublished(text)) continue;
      const fm = frontmatterOf(text);
      const trail = relative.map((segment) => segment.replace(/\.md$/, ""));
      const [top = ""] = relative;
      servedLearnCache.push({
        course: top === "courses" ? (trail[1] ?? "") : "",
        slug: trail[trail.length - 1] ?? "",
        kind: top === "courses" ? (trail[2] ?? "") : top,
        route: `/en/learn/${trail.join("/")}`,
        title: fieldOf(fm, "title"),
        weight: Number(fieldOf(fm, "weight") || 0),
        text,
      });
    }
  }
  return servedLearnCache;
}

// servedLearnPageWhere returns the first published page under the English learn
// tree, courses or legacy, whose source satisfies the rule.
export function servedLearnPageWhere(rule: (text: string) => boolean, reason: string): LearningPage {
  const found = servedLearnPages().find((page) => rule(page.text));
  if (!found) throw new Error(`no published learn page in the real corpus has ${reason}`);
  return found;
}

export function learningPages(): LearningPage[] {
  if (learningCache === undefined) {
    learningCache = coursePages().filter((page) => page.kind === "learning");
  }
  return learningCache;
}

// nth returns the item at an index, failing loudly when the real corpus has too few items for the witness.
export function nth<T>(items: readonly T[], index: number, reason: string): T {
  const item = items[index];
  if (item === undefined) throw new Error(`the real corpus has no item ${index} for ${reason}`);
  return item;
}

// learningPageWhere returns the first published learning page whose source satisfies the rule.
export function learningPageWhere(rule: (text: string) => boolean, reason: string): LearningPage {
  const found = learningPages().find((page) => rule(page.text));
  if (!found) throw new Error(`no published learning page in the real corpus has ${reason}`);
  return found;
}

// coursePageWhere returns the first published course page, of any kind, whose source satisfies the rule.
export function coursePageWhere(rule: (text: string) => boolean, reason: string): LearningPage {
  const found = coursePages().find((page) => rule(page.text));
  if (!found) throw new Error(`no published course page in the real corpus has ${reason}`);
  return found;
}

// primaryCourse is the first course with at least two published learning pages, with those pages in weight order.
export function primaryCourse(): { course: CourseIndex; pages: LearningPage[] } {
  for (const course of courseIndexes()) {
    const pages = learningPages()
      .filter((page) => page.course === course.slug)
      .sort((a, b) => a.weight - b.weight || a.slug.localeCompare(b.slug));
    if (pages.length >= 2) return { course, pages };
  }
  throw new Error("no course in the real corpus has two published learning pages");
}

// courseWhere returns the first published course index whose frontmatter satisfies the rule.
export function courseWhere(rule: (course: CourseIndex) => boolean, reason: string): CourseIndex {
  const found = courseIndexes().find(rule);
  if (!found) throw new Error(`no published course in the real corpus has ${reason}`);
  return found;
}

// pathWitnesses lists the path manifests with their phases' course slugs, in path-id order.
export function pathWitnesses(): PathWitness[] {
  const paths: PathWitness[] = [];
  for (const file of markdownFilesOrJson(manifestRoot)) {
    const manifest = JSON.parse(readFileSync(file, "utf8")) as {
      pathId: string;
      title: string;
      phases?: { courses?: string[] }[];
    };
    const phases = (manifest.phases ?? []).map((phase) => phase.courses ?? []);
    paths.push({
      id: manifest.pathId,
      route: `/en/learn/paths/${manifest.pathId}`,
      title: manifest.title,
      phases,
      courses: phases.flat(),
    });
  }
  return paths.sort((a, b) => a.id.localeCompare(b.id));
}

// primaryPage returns the learning page at an index of the primary course; the primary course has at least two.
export function primaryPage(index: number): LearningPage {
  return nth(primaryCourse().pages, index, "two learning pages of the primary course");
}

// pathWhere returns the first path manifest with at least two phases, each holding a course.
export function pathWhere(): PathWitness {
  const found = pathWitnesses().find(
    (paths) => paths.phases.length >= 2 && paths.phases.every((phase) => phase.length > 0),
  );
  if (!found) throw new Error("no path manifest in the real corpus has two non-empty phases");
  return found;
}

// pathContaining returns the first path whose phases hold the course, so a lesson opened through it is in that path.
export function pathContaining(course: string): PathWitness {
  const found = pathWitnesses().find((paths) => paths.courses.includes(course));
  if (!found) throw new Error(`no path in the real corpus contains ${course}`);
  return found;
}

function markdownFilesOrJson(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...markdownFilesOrJson(full));
    } else if (entry.endsWith(".json")) {
      found.push(full);
    }
  }
  return found;
}

// fenceLanguages lists the language tags of the fenced blocks in a source.
export function fenceLanguages(text: string): string[] {
  return [...text.matchAll(/^```([A-Za-z0-9_+.#-]*)/gm)].map((match) => match[1] ?? "").filter((tag) => tag.length > 0);
}

// longestFenceLine is the length of the longest line inside any fenced block of a source.
export function longestFenceLine(text: string): number {
  let longest = 0;
  for (const block of text.matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)) {
    for (const line of (block[1] ?? "").split("\n")) {
      longest = Math.max(longest, line.length);
    }
  }
  return longest;
}

// outsideFences returns a source with its fenced code blocks removed, so structure rules never match code text.
export function outsideFences(text: string): string {
  return text.replace(/^```[\s\S]*?^```/gm, "");
}

// headingsOf lists the second-level headings of a source, in order.
export function headingsOf(text: string): string[] {
  return [...text.matchAll(/^## (.+)$/gm)].map((match) => (match[1] ?? "").trim());
}

// relativeFragmentLink returns the first Markdown link in a source that is relative (not root-absolute, not external) and carries a fragment.
export function relativeFragmentLink(text: string): string | undefined {
  const match = /\]\((?![/#]|https?:|mailto:)([^)\s]*#[^)\s]+)\)/.exec(text);
  return match ? match[1] : undefined;
}
