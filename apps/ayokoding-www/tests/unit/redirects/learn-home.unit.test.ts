import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";
import { courseRehomeRedirects } from "../../../src/redirects/course-rehome";
import { learnHomeRedirects } from "../../../src/redirects/learn-home";
import { learnThreeBucketRedirects } from "../../../src/redirects/learn-three-bucket";

const EXPECTED = { source: "/en/learn/overview", destination: "/en/learn", permanent: true };

describe("learnHomeRedirects", () => {
  it("moves the old Learn overview address to the Learn home with one rule", () => {
    expect(learnHomeRedirects).toEqual([EXPECTED]);
  });

  it("answers permanently, from the exact source, to the bare Learn home", () => {
    const rule = learnHomeRedirects.find((candidate) => candidate.source === "/en/learn/overview");

    expect(rule).toBeDefined();
    expect(rule?.permanent).toBe(true);
    expect(rule?.destination).toBe("/en/learn");
    expect(rule?.destination.endsWith("/")).toBe(false);
  });

  it("adds no :path* source, so a deeper address under the old overview matches no rule (S31a)", () => {
    expect(learnHomeRedirects.some((rule) => rule.source.includes(":path*"))).toBe(false);
    expect(learnHomeRedirects.some((rule) => rule.source.startsWith("/en/learn/overview/"))).toBe(false);
  });
});

describe("next.config.ts redirect order", () => {
  async function resolvedRules(): Promise<Array<{ source: string; destination: string }>> {
    const redirects = nextConfig.redirects;
    if (redirects === undefined) {
      throw new Error("next.config.ts declares no redirects()");
    }
    return (await redirects()) as Array<{ source: string; destination: string }>;
  }

  it("spreads learnHomeRedirects after courseRehomeRedirects and before learnThreeBucketRedirects", async () => {
    const rules = await resolvedRules();
    const index = rules.findIndex(
      (rule) => rule.source === EXPECTED.source && rule.destination === EXPECTED.destination,
    );
    expect(index, "the learn-home rule is not in the resolved redirect list").toBeGreaterThanOrEqual(0);

    const courseRehomeSources = new Set(courseRehomeRedirects.map((rule) => rule.source));
    const bucketSources = new Set(learnThreeBucketRedirects.map((rule) => rule.source));

    const lastCourseRehome = rules.reduce((last, rule, at) => (courseRehomeSources.has(rule.source) ? at : last), -1);
    const firstBucket = rules.findIndex((rule) => bucketSources.has(rule.source));

    expect(lastCourseRehome, "courseRehomeRedirects contributes no rule").toBeGreaterThanOrEqual(0);
    expect(firstBucket, "learnThreeBucketRedirects contributes no rule").toBeGreaterThanOrEqual(0);
    expect(index).toBeGreaterThan(lastCourseRehome);
    expect(index).toBeLessThan(firstBucket);
  });

  it("keeps the three spreads in that order in the config source", () => {
    const source = readFileSync(new URL("../../../next.config.ts", import.meta.url), "utf8");
    const courseRehome = source.indexOf("...courseRehomeRedirects");
    const learnHome = source.indexOf("...learnHomeRedirects");
    const threeBucket = source.indexOf("...learnThreeBucketRedirects");

    expect(courseRehome).toBeGreaterThanOrEqual(0);
    expect(learnHome).toBeGreaterThanOrEqual(0);
    expect(threeBucket).toBeGreaterThanOrEqual(0);
    expect(courseRehome).toBeLessThan(learnHome);
    expect(learnHome).toBeLessThan(threeBucket);
  });
});
