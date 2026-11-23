import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { contentNamespaceRedirects } from "../../../src/redirects/content-namespace";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/content-namespace-redirects.feature",
  ),
);

interface NavigationResult {
  status: number;
  location: string;
}

function navigate(requestPath: string): NavigationResult {
  const rule = contentNamespaceRedirects.find(({ source }) => {
    const prefix = source.replace(":path*", "");
    return requestPath.startsWith(prefix);
  });
  if (rule === undefined) return { status: 200, location: requestPath };
  const wildcard = requestPath.slice(rule.source.replace(":path*", "").length);
  return { status: rule.permanent ? 308 : 307, location: rule.destination.replace(":path*", wildcard) };
}

describeFeature(feature, ({ Scenario, ScenarioOutline, Background }) => {
  let appReady = false;
  let result: NavigationResult = { status: 0, location: "" };

  Background(({ Given }) => {
    Given("the app is running", () => {
      appReady = contentNamespaceRedirects.length === 5;
      result = { status: 0, location: "" };
    });
  });

  function visit(requestPath: string): void {
    expect(appReady).toBe(true);
    result = navigate(requestPath);
  }

  function assertTopLevel(pathname: string): void {
    expect(result).toEqual({ status: 200, location: pathname });
    expect(result.location).not.toContain("/c/");
  }

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/content-namespace-redirects.feature: A /c/-namespaced English learn URL permanently redirects to its bare URL
  Scenario("A /c/-namespaced English learn URL permanently redirects to its bare URL", ({ When, Then, And }) => {
    When('a raw HTTP GET is made to "/en/c/learn/software-engineering" with redirects disabled', () => {
      visit("/en/c/learn/software-engineering");
    });
    Then("the response status should be 308", () => {
      expect(result.status).toBe(308);
    });
    And('the response Location header should equal "/en/learn/software-engineering"', () => {
      expect(result.location).toBe("/en/learn/software-engineering");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/content-namespace-redirects.feature: A /c/-namespaced Indonesian belajar URL permanently redirects to its bare URL
  Scenario("A /c/-namespaced Indonesian belajar URL permanently redirects to its bare URL", ({ When, Then, And }) => {
    When('a raw HTTP GET is made to "/id/c/belajar/ikhtisar" with redirects disabled', () => {
      visit("/id/c/belajar/ikhtisar");
    });
    Then("the response status should be 308", () => {
      expect(result.status).toBe(308);
    });
    And('the response Location header should equal "/id/belajar/ikhtisar"', () => {
      expect(result.location).toBe("/id/belajar/ikhtisar");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/content-namespace-redirects.feature: top-level pages are not redirected
  ScenarioOutline("top-level pages are not redirected", ({ When, Then, And }, variables) => {
    const url = String(variables.url);
    When('a visitor navigates to "<url>"', () => visit(url));
    Then("the page should load successfully", () => expect(result.status).toBe(200));
    And('the current URL should not contain "/c/"', () => assertTopLevel(url));
  });
});
