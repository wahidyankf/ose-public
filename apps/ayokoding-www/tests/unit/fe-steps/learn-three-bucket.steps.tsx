import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { structuralBuckets } from "../../../src/features/content/core/structural-buckets";
import { contentNamespaceRedirects } from "../../../src/redirects/content-namespace";
import { courseRehomeRedirects } from "../../../src/redirects/course-rehome";
import { learnReorgRedirects } from "../../../src/redirects/learn-reorg";
import { learnThreeBucketRedirects } from "../../../src/redirects/learn-three-bucket";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature",
  ),
);

type RedirectRule = { source: string; destination: string; permanent: boolean };
const orderedRules: readonly RedirectRule[] = [
  ...contentNamespaceRedirects,
  ...learnReorgRedirects,
  ...courseRehomeRedirects,
  ...learnThreeBucketRedirects,
];

function applyOne(pathname: string): string | undefined {
  for (const rule of orderedRules) {
    if (rule.source.endsWith("/:path*")) {
      const base = rule.source.slice(0, -"/:path*".length);
      if (pathname !== base && !pathname.startsWith(`${base}/`)) continue;
      const rest = pathname === base ? "" : pathname.slice(base.length + 1);
      const destinationBase = rule.destination.slice(0, -"/:path*".length);
      return rest.length > 0 ? `${destinationBase}/${rest}` : destinationBase;
    }
    if (pathname === rule.source) return rule.destination;
  }
  return undefined;
}

function followRedirects(pathname: string): { finalPath: string; hops: number; healthy: boolean } {
  let current = pathname;
  const seen = new Set([current]);
  for (let hops = 0; hops < 8; hops += 1) {
    const next = applyOne(current);
    if (next === undefined) return { finalPath: current, hops, healthy: true };
    if (seen.has(next)) return { finalPath: next, hops: hops + 1, healthy: false };
    current = next;
    seen.add(current);
  }
  return { finalPath: current, hops: 8, healthy: false };
}

describeFeature(feature, ({ Scenario, ScenarioOutline, Background }) => {
  let appReady = false;
  let navigation = { finalPath: "", hops: 0, healthy: false };
  let buckets: string[] = [];

  Background(({ Given }) => {
    Given("the app is running", () => {
      appReady = orderedRules.length > 0;
      navigation = { finalPath: "", hops: 0, healthy: false };
      buckets = [];
    });
  });

  function visit(pathname: string): void {
    expect(appReady).toBe(true);
    navigation = followRedirects(pathname);
  }

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: The Learn section offers only Paths, Courses, and Legacy
  Scenario("The Learn section offers only Paths, Courses, and Legacy", ({ When, Then, And }) => {
    When("the content tree under the en learn section is inspected", () => {
      buckets = structuralBuckets([
        { name: "_index.md", kind: "file" },
        { name: "overview.md", kind: "file" },
        { name: "paths", kind: "directory" },
        { name: "courses", kind: "directory" },
        { name: "legacy", kind: "directory" },
      ]);
    });
    Then("its only structural buckets are paths, courses, and legacy", () => {
      expect(buckets).toEqual(["courses", "legacy", "paths"]);
    });
    And("no former subject domain remains as a direct child of the learn section", () => {
      expect(buckets.every((bucket) => ["courses", "legacy", "paths"].includes(bucket))).toBe(true);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: A relocated legacy domain URL redirects to its legacy address
  Scenario("A relocated legacy domain URL redirects to its legacy address", ({ When, Then }) => {
    When('a visitor navigates to "/en/learn/software-engineering/overview"', () => {
      visit("/en/learn/software-engineering/overview");
    });
    Then('the current URL should contain "/en/learn/legacy/software-engineering/overview"', () => {
      expect(navigation.finalPath).toBe("/en/learn/legacy/software-engineering/overview");
      expect(navigation.hops).toBe(1);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: A relocated legacy domain URL redirects to its legacy address in one hop
  ScenarioOutline(
    "A relocated legacy domain URL redirects to its legacy address in one hop",
    ({ When, Then, And }, examples) => {
      const domain = String(examples["domain"] ?? "");
      When('a visitor navigates to "/en/learn/<domain>/overview"', () => {
        visit(`/en/learn/${domain}/overview`);
      });
      Then('the current URL should contain "/en/learn/legacy/<domain>/overview"', () => {
        expect(navigation.finalPath).toBe(`/en/learn/legacy/${domain}/overview`);
        expect(navigation.hops).toBe(1);
      });
      And("the response status should not be a client or server error", () => {
        expect(navigation.healthy).toBe(true);
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: A stale /c-bookmarked legacy domain URL redirects to its legacy address in two hops
  ScenarioOutline(
    "A stale /c-bookmarked legacy domain URL redirects to its legacy address in two hops",
    ({ When, Then, And }, examples) => {
      const domain = String(examples["domain"] ?? "");
      When('a visitor navigates to "/en/c/learn/<domain>/overview"', () => {
        visit(`/en/c/learn/${domain}/overview`);
      });
      Then('the current URL should contain "/en/learn/legacy/<domain>/overview"', () => {
        expect(navigation.finalPath).toBe(`/en/learn/legacy/${domain}/overview`);
        expect(navigation.hops).toBe(2);
      });
      And("the response status should not be a client or server error", () => {
        expect(navigation.healthy).toBe(true);
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: A historical learn-reorg source chains through to its legacy address
  Scenario("A historical learn-reorg source chains through to its legacy address", ({ When, Then, And }) => {
    When('a visitor navigates to "/en/learn/human/overview"', () => {
      visit("/en/learn/human/overview");
    });
    Then('the current URL should contain "/en/learn/legacy/personal-development/overview"', () => {
      expect(navigation.finalPath).toBe("/en/learn/legacy/personal-development/overview");
      expect(navigation.hops).toBe(2);
    });
    And("the response status should not be a client or server error", () => {
      expect(navigation.healthy).toBe(true);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: The legacy redirect does not rewrite a canonical courses URL
  Scenario("The legacy redirect does not rewrite a canonical courses URL", ({ When, Then }) => {
    When('a visitor navigates to "/en/learn/courses/just-enough-nvim"', () => {
      visit("/en/learn/courses/just-enough-nvim");
    });
    Then('the current URL should not contain "/legacy/"', () => {
      expect(navigation).toEqual({ finalPath: "/en/learn/courses/just-enough-nvim", hops: 0, healthy: true });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: The legacy redirect does not rewrite a canonical paths URL
  Scenario("The legacy redirect does not rewrite a canonical paths URL", ({ When, Then }) => {
    When('a visitor navigates to "/en/learn/paths/careers"', () => {
      visit("/en/learn/paths/careers");
    });
    Then('the current URL should not contain "/legacy/"', () => {
      expect(navigation).toEqual({ finalPath: "/en/learn/paths/careers", hops: 0, healthy: true });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: The legacy redirect does not interfere with a re-homed fundamentally-strong course URL
  Scenario(
    "The legacy redirect does not interfere with a re-homed fundamentally-strong course URL",
    ({ When, Then }) => {
      When('a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python"', () => {
        visit("/en/learn/fundamentally-strong/software-engineer/just-enough-python");
      });
      Then('the current URL should contain "/en/learn/courses/just-enough-python"', () => {
        expect(navigation.finalPath).toBe("/en/learn/courses/just-enough-python");
        expect(navigation.hops).toBe(1);
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/learn-three-bucket.feature: A deep legacy path keeps its sub-taxonomy verbatim
  Scenario("A deep legacy path keeps its sub-taxonomy verbatim", ({ When, Then, And }) => {
    When(
      'a visitor navigates to "/en/learn/software-engineering/programming-languages/python/by-example/advanced"',
      () => visit("/en/learn/software-engineering/programming-languages/python/by-example/advanced"),
    );
    Then(
      'the current URL should contain "/en/learn/legacy/software-engineering/programming-languages/python/by-example/advanced"',
      () => {
        expect(navigation.finalPath).toBe(
          "/en/learn/legacy/software-engineering/programming-languages/python/by-example/advanced",
        );
      },
    );
    And("the response status should not be a client or server error", () => {
      expect(navigation.healthy).toBe(true);
    });
  });
});
