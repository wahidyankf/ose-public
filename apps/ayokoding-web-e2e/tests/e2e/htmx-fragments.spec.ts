// Focused fragment-adjacent proof: the full-page query-parameter fallbacks
// behind the htmx regions keep working with and without script-driven swaps.
// Fragment endpoints themselves are sibling-lane work; this spec locks the
// fallback contracts those fragments must preserve.
import { expect, test } from "@playwright/test";
import { bodyOf, fetchText, gotoPage, statusOf } from "./support/http";

test("search falls back to full-page results without scripts", async ({ page }) => {
  await fetchText(page, "/en/search?q=hello");
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("/en/learn/courses/go-basics/learning/hello-world");
  expect(bodyOf(page)).not.toContain("/id/");
});

test("empty search input clears results without an error", async ({ page }) => {
  await fetchText(page, "/en/search?q=%20%20");
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("data-search-empty");
  expect(bodyOf(page)).not.toContain("data-result=");
});

test("benchmark filters fall back to full-page rendering", async ({ page }) => {
  await gotoPage(
    page,
    "/en/tools/ai-benchmark?harness=cursor&tier=planning&sub=gpt-5.6-terra&sub-harness=command-code",
  );
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain('value="cursor"');
  expect(bodyOf(page)).toContain("data-encoded-state");
});

test("benchmark recovers unknown filter values with defaults", async ({ page }) => {
  await fetchText(page, "/en/tools/ai-benchmark?harness=nope&tier=nope");
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain('data-count="93"');
  expect(bodyOf(page)).toContain("data-encoded-state");
});

test("calculator inputs fall back to full-page rendering", async ({ page }) => {
  await gotoPage(
    page,
    "/en/tools/cost-of-living-calculator?city=singapore&gross=5000&baseline=my_salary&mygross=5000&mysalarycity=singapore",
  );
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("SGD 4,718");
  expect(bodyOf(page)).toContain("data-encoded-state");
});

test("calculator rejects invalid arithmetic with an inline state", async ({ page }) => {
  await fetchText(page, "/en/tools/cost-of-living-calculator?city=jakarta&role=mid&mode=standard&workers=1");
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("data-invalid-filters");
  expect(bodyOf(page)).not.toContain("data-tool-estimate");
});

test("pages expose the htmx hooks the fragments will use", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
  expect(statusOf(page)).toBe(200);
  const html = await page.content();
  expect(html).toContain("/assets/js/htmx.min.js");
  expect(html).toContain("data-search-dialog");
});
