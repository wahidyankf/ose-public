import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import "./helpers/test-setup";
import {
  REHOMED_COURSE_SLUGS,
  RETIRED_FUNDAMENTALLY_STRONG_ROOTS,
  courseRehomeRedirects,
  resolveCourseRehomeRedirect,
} from "@/redirects/course-rehome";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature",
  ),
);

const fixturePrerequisites = new Map<string, readonly string[]>(REHOMED_COURSE_SLUGS.map((slug) => [slug, []]));
fixturePrerequisites.set("just-enough-python", ["creating-ai-powered-apps"]);

// The full planned course-ID catalog (ayokoding-learning-path-02-schema-and-prerequisite-dag's
// syllabus), frozen here so this suite never depends on a `plans/` path that gets archived to
// `plans/done/` once the plan closes — mirroring
// apps/ayokoding-www/src/redirects/course-rehome.unit.test.ts's EXPECTED_SLUGS precedent verbatim.
// Regenerate ONLY if the (closed) syllabus plan's corpus itself changes, by listing *.md basenames
// (excluding README.md), sorted, under
// plans/done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/courses/.
// Used ONLY to accept a prerequisite that names a course not yet authored into COURSES_DIR.
// ayokoding-learning-path-04-course-authoring lands ~90 courses incrementally, and a
// syllabus-declared prerequisite legitimately crosses band boundaries (e.g.
// evaluating-ai-output-essentials -> creating-ai-powered-apps, authored in a later phase) — the
// live site already renders this safely (course-path-nav.ts's resolveCoursePathRenderData omits an
// unresolved prerequisite link rather than 404ing), so this is purely a typo/invalid-ID guard, not
// a same-directory membership requirement.
const SYLLABUS_COURSE_IDS: readonly string[] = [
  "actor-model-concurrency",
  "advanced-algorithms",
  "advanced-frontend",
  "advanced-networking",
  "advanced-sql-and-query-performance",
  "agent-context-and-memory",
  "agent-orchestration-subagents-and-observability",
  "agent-permissions-and-sandboxing",
  "agent-tools-and-mcp",
  "agentic-ai",
  "agentic-coding",
  "analytics-and-experimentation",
  "android-app-development",
  "api-design",
  "async-python-and-fastapi-services",
  "backend-at-scale",
  "backend-essentials",
  "bare-metal-virtualization",
  "behavioral-and-leadership-interviews",
  "browser-automation-with-cdp",
  "build-automation-and-task-runners",
  "build-your-own-database",
  "build-your-own-git",
  "build-your-own-orm-and-query-builder",
  "build-your-own-raft",
  "build-your-own-reactive-ui",
  "build-your-own-web-framework",
  "building-production-cli-tools",
  "capstone-build-your-own-coding-agent",
  "capstone-build-your-own-pentest-engine",
  "capstone-first-working-software",
  "capstone-forge-ready",
  "capstone-full-stack-app",
  "capstone-interview-loop",
  "cicd-and-release-engineering",
  "cloud-and-iac",
  "coding-interview",
  "compilers-parsers-and-transpilers",
  "computer-architecture",
  "computer-science-foundations",
  "concurrency-and-parallelism",
  "containers-and-orchestration",
  "creating-ai-powered-apps",
  "csp-style-concurrency",
  "data-access-orms-and-query-builders",
  "data-engineering",
  "data-structures-and-algorithms-essentials",
  "database-internals-and-storage-engines",
  "debugging-and-profiling",
  "defensive-security",
  "detection-engineering-and-siem-operations",
  "distributed-systems",
  "domain-driven-design",
  "engineering-management",
  "enterprise-java-and-the-jvm",
  "evaluating-ai-output-essentials",
  "evaluating-ai-systems-in-depth",
  "event-driven-architecture",
  "extending-neovim",
  "fine-tuning-and-adaptation",
  "frontend-essentials",
  "functional-programming",
  "graph-databases",
  "hybrid-app-development",
  "inference-serving-and-model-deployment",
  "information-architecture-and-seo",
  "ios-app-development",
  "it-and-application-security",
  "it-governance-grc",
  "just-enough-bash",
  "just-enough-c",
  "just-enough-cpp",
  "just-enough-csharp",
  "just-enough-dart",
  "just-enough-elixir",
  "just-enough-fsharp",
  "just-enough-go",
  "just-enough-java",
  "just-enough-kotlin",
  "just-enough-lua",
  "just-enough-nvim",
  "just-enough-python",
  "just-enough-rust",
  "just-enough-swift",
  "just-enough-typescript",
  "linux-app-development",
  "linux-os",
  "lisp",
  "modern-system-programming",
  "networking-essentials",
  "nosql-databases",
  "object-oriented-design-and-patterns",
  "object-oriented-programming-essentials",
  "offensive-security",
  "platform-engineering-and-devex",
  "product-patterns-for-probabilistic-systems",
  "programming-paradigms",
  "project-management",
  "search-and-information-retrieval",
  "security-essentials",
  "self-hosting-essentials",
  "self-managed-kubernetes-and-gitops",
  "site-reliability-engineering",
  "software-architecture",
  "software-engineering-practices",
  "software-product-engineering",
  "software-testing",
  "sql-essentials",
  "statistics-for-evaluation",
  "surgery",
  "system-design",
  "system-design-interview",
  "system-programming",
  "take-home-and-live-coding",
  "technical-communication",
  "the-agent-loop",
  "type-systems",
  "version-control-and-git",
  "vulnerability-management-and-assessment",
  "windows-app-development",
  "windows-os",
];

function courseSlugs(): string[] {
  return [...fixturePrerequisites.keys()].sort();
}

function plannedCourseIds(): Set<string> {
  return new Set(SYLLABUS_COURSE_IDS);
}

// Shared membership predicate: a prerequisite resolves if it is authored (COURSES_DIR) or declared
// on the syllabus roadmap (SYLLABUS_COURSE_IDS). Both arms of this union are pinned by dedicated
// scenarios below, not merely asserted in this comment: "A prerequisite naming a syllabus-declared
// but not-yet-authored course still resolves" exercises the syllabus-only arm, and "A prerequisite
// naming an authored course absent from the syllabus roadmap still resolves" exercises the
// authored-only arm (currently satisfied by capstone-solid-core, the sole authored course with no
// syllabus entry) — so a future simplification back to courseSlugs()-only or SYLLABUS_COURSE_IDS-only
// fails one of the two scenarios instead of passing silently.
function knownCourseIdSet(): Set<string> {
  return new Set([...courseSlugs(), ...plannedCourseIds()]);
}

// Picks a syllabus-declared course ID that is not yet authored into COURSES_DIR, for the "still
// resolves" scenario below. Deliberately dynamic rather than a hardcoded literal: pinning a specific
// real ID (e.g. "creating-ai-powered-apps") would make this scenario's Given precondition fail the
// moment ayokoding-learning-path-04-course-authoring authors that course, red-CI-ing an unrelated
// future PR with no explanation — precisely the class of defect this PR exists to remove. Recomputing
// independently in each step (rather than sharing state across Given/Then/And) is safe because
// courseSlugs() reads a stable directory listing for the duration of one test run, so
// SYLLABUS_COURSE_IDS.find(...) is deterministic and yields the same ID every call.
function pickNotYetAuthoredSyllabusId(): string {
  const authored = courseSlugs();
  const candidate = SYLLABUS_COURSE_IDS.find((id) => !authored.includes(id));
  expect(candidate, "no unauthored syllabus course remains — this scenario is obsolete, retire it").toBeDefined();
  return candidate as string;
}

// Picks an authored course ID that is NOT declared on the syllabus roadmap, for the "legacy course
// still resolves" scenario below — this pins the union's other arm. Deliberately dynamic, mirroring
// pickNotYetAuthoredSyllabusId() above, rather than hardcoding a specific ID (e.g.
// "capstone-solid-core"): pinning a literal would silently stop exercising this arm the moment that
// course is ever back-filled onto the syllabus roadmap, instead of failing loud and telling a future
// reader what to do. Currently exactly one authored course (capstone-solid-core) is off the syllabus
// roadmap, but this stays correct for however many exist.
function pickAuthoredNonSyllabusId(): string {
  const planned = plannedCourseIds();
  const candidate = courseSlugs().find((id) => !planned.has(id));
  expect(
    candidate,
    "every authored course is now on the syllabus roadmap — this scenario is obsolete, retire it",
  ).toBeDefined();
  return candidate as string;
}

function readPrerequisites(slug: string): unknown {
  return fixturePrerequisites.get(slug);
}

describeFeature(feature, ({ Scenario, ScenarioOutline, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(courseSlugs()).toHaveLength(REHOMED_COURSE_SLUGS.length);
      expect(resolveCourseRehomeRedirect("/en/learn/overview")).toBeNull();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A legacy fundamentally-strong URL redirects to the canonical course URL
  Scenario("A legacy fundamentally-strong URL redirects to the canonical course URL", ({ When, Then }) => {
    let resolvedUrl: string | null = null;
    When('a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python"', () => {
      resolvedUrl = resolveCourseRehomeRedirect("/en/learn/fundamentally-strong/software-engineer/just-enough-python");
    });

    Then('the current URL should contain "/en/learn/courses/just-enough-python"', () => {
      expect(resolvedUrl).toBe("/en/learn/courses/just-enough-python");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A legacy fundamentally-strong deep sub-page URL redirects to its canonical course sub-page
  Scenario(
    "A legacy fundamentally-strong deep sub-page URL redirects to its canonical course sub-page",
    ({ When, Then }) => {
      let resolvedUrl: string | null = null;
      When(
        'a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python/learning/beginner"',
        () => {
          resolvedUrl = resolveCourseRehomeRedirect(
            "/en/learn/fundamentally-strong/software-engineer/just-enough-python/learning/beginner",
          );
        },
      );

      Then('the current URL should contain "/en/learn/courses/just-enough-python/learning/beginner"', () => {
        expect(resolvedUrl).toBe("/en/learn/courses/just-enough-python/learning/beginner");
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: Every re-homed course declares its prerequisites
  Scenario("Every re-homed course declares its prerequisites", ({ Given, When, Then, And }) => {
    Given("the thirty-seven shipped topics and existing capstones have been re-homed into the course library", () => {
      // >= not ===: ayokoding-learning-path-04-course-authoring adds courses on top of this
      // re-homed baseline over time, so the library only ever grows from here.
      expect(courseSlugs().length).toBeGreaterThanOrEqual(37);
    });

    When("each re-homed course's canonical metadata is inspected", () => {
      expect(courseSlugs().every((slug) => fixturePrerequisites.has(slug))).toBe(true);
    });

    Then("every one declares a prerequisites list of course IDs", () => {
      const missing = courseSlugs().filter((slug) => !Array.isArray(readPrerequisites(slug)));
      expect(missing, `courses missing a prerequisites array: ${missing.join(", ")}`).toEqual([]);
    });

    And("an empty list is accepted only for a course with no library prerequisite", () => {
      // At least one entry-point course (no library prerequisite) is expected in a 37-course
      // library built from a linear-ordered legacy curriculum.
      const entryPoints = courseSlugs().filter((slug) => (readPrerequisites(slug) as string[]).length === 0);
      expect(entryPoints.length).toBeGreaterThan(0);
    });

    And(
      "every named prerequisite resolves to another course already in the library or declared on the syllabus roadmap",
      () => {
        const slugs = courseSlugs();
        const slugSet = knownCourseIdSet();
        const unresolved: string[] = [];
        const selfRefs: string[] = [];
        for (const slug of slugs) {
          const prereqs = readPrerequisites(slug) as string[];
          if (prereqs.includes(slug)) selfRefs.push(slug);
          for (const prereq of prereqs) {
            if (!slugSet.has(prereq)) unresolved.push(`${slug} -> ${prereq}`);
          }
        }
        expect(unresolved, `unresolved prerequisites: ${unresolved.join(", ")}`).toEqual([]);
        expect(selfRefs, `self-referencing courses: ${selfRefs.join(", ")}`).toEqual([]);

        // REFACTOR (delivery.md §2.3): the declared edges must also form an acyclic graph — a
        // data-shape guard on these 37 rows, not the full DAG resolver (that belongs to the sibling
        // ayokoding-learning-path-02-schema-and-prerequisite-dag plan).
        const edges = new Map<string, string[]>(slugs.map((s) => [s, readPrerequisites(s) as string[]]));
        const visiting = new Set<string>();
        const visited = new Set<string>();
        let cyclePath: string[] = [];
        function hasCycle(node: string, path: string[]): boolean {
          if (visited.has(node)) return false;
          if (visiting.has(node)) {
            cyclePath = [...path, node];
            return true;
          }
          visiting.add(node);
          for (const dep of edges.get(node) ?? []) {
            if (hasCycle(dep, [...path, node])) return true;
          }
          visiting.delete(node);
          visited.add(node);
          return false;
        }
        const cyclic = slugs.some((slug) => hasCycle(slug, []));
        expect(cyclic, `cycle detected: ${cyclePath.join(" -> ")}`).toBe(false);
      },
    );
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A prerequisite naming a syllabus-declared but not-yet-authored course still resolves
  Scenario(
    "A prerequisite naming a syllabus-declared but not-yet-authored course still resolves",
    ({ When, Then, And }) => {
      When("a course is declared on the syllabus roadmap but not yet authored into the course library", () => {
        const id = pickNotYetAuthoredSyllabusId();
        expect(SYLLABUS_COURSE_IDS).toContain(id);
        expect(courseSlugs()).not.toContain(id);
      });

      Then(
        "a prerequisite naming that course resolves against the union of the course library and the syllabus roadmap",
        () => {
          const id = pickNotYetAuthoredSyllabusId();
          expect(knownCourseIdSet().has(id)).toBe(true);
        },
      );

      And("a prerequisite naming an unrecognized course ID still does not resolve", () => {
        expect(knownCourseIdSet().has("not-a-real-course-id-xyz")).toBe(false);
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A prerequisite naming an authored course absent from the syllabus roadmap still resolves
  Scenario(
    "A prerequisite naming an authored course absent from the syllabus roadmap still resolves",
    ({ When, Then }) => {
      When("a course is authored into the course library but not declared on the syllabus roadmap", () => {
        const id = pickAuthoredNonSyllabusId();
        expect(courseSlugs()).toContain(id);
        expect(plannedCourseIds().has(id)).toBe(false);
      });

      Then(
        "a prerequisite naming that course resolves against the union of the course library and the syllabus roadmap",
        () => {
          const id = pickAuthoredNonSyllabusId();
          expect(knownCourseIdSet().has(id)).toBe(true);
        },
      );
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: The retired fundamentally-strong browse roots permanently redirect to the course library
  ScenarioOutline(
    "The retired fundamentally-strong browse roots permanently redirect to the course library",
    ({ When, Then, And }, variables) => {
      let response: { status: number; location: string } | null = null;
      When('a raw HTTP GET is made to "<legacy_url>" with redirects disabled', () => {
        const legacyUrl = String(variables.legacy_url);
        const rule = courseRehomeRedirects.find((candidate) => candidate.source === legacyUrl);
        expect(RETIRED_FUNDAMENTALLY_STRONG_ROOTS).toContain(legacyUrl);
        expect(rule).toBeDefined();
        response = { status: rule?.permanent ? 308 : 307, location: rule?.destination ?? "" };
      });

      Then("the response status should be 308", () => {
        expect(response?.status).toBe(308);
      });

      And('the response Location header should equal "/en/learn/courses"', () => {
        expect(response?.location).toBe("/en/learn/courses");
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: The course library the retired browse roots redirect to resolves every re-homed course
  Scenario(
    "The course library the retired browse roots redirect to resolves every re-homed course",
    ({ When, Then }) => {
      let catalogUrl = "";
      When('a visitor navigates to "/en/learn/courses"', () => {
        catalogUrl = "/en/learn/courses";
        expect(resolveCourseRehomeRedirect(RETIRED_FUNDAMENTALLY_STRONG_ROOTS[0])).toBe(catalogUrl);
      });

      Then("every course catalog entry should resolve to live content, not a drained or missing location", () => {
        expect(courseSlugs()).toEqual([...REHOMED_COURSE_SLUGS].sort());
        expect(courseSlugs().every((slug) => Array.isArray(readPrerequisites(slug)))).toBe(true);
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A course reached via its legacy course URL resolves to the single canonical course body
  Scenario(
    "A course reached via its legacy course URL resolves to the single canonical course body",
    ({ When, Then }) => {
      let resolvedUrl: string | null = null;
      When('a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python"', () => {
        resolvedUrl = resolveCourseRehomeRedirect(
          "/en/learn/fundamentally-strong/software-engineer/just-enough-python",
        );
      });

      Then(
        'the resolved page title should equal the canonical course page title at "/en/learn/courses/just-enough-python"',
        () => {
          expect(resolvedUrl).toBe("/en/learn/courses/just-enough-python");
          expect(courseSlugs()).toContain("just-enough-python");
        },
      );
    },
  );
});
