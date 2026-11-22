import { describe, expect, it } from "vitest";
import { learnHomeRedirects } from "../../../src/redirects/learn-home";

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
