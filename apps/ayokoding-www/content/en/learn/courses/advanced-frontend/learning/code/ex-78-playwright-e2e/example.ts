// Example 78: A Playwright E2E Smoke Test. (co-36)
//
// Playwright drives a REAL browser through the critical path: navigate, fill the search box, click
// search, assert a result is visible. Unlike a unit test, it exercises the whole stack in a real
// browser. This example models those steps and the visible-result assertion that defines a "smoke"
// pass.
//
// Note: "Playwright Test is an end-to-end test framework for modern web apps."
// Source: Playwright (https://playwright.dev/docs/intro).

// A simulated page a Playwright test drives (the browser tab under automation).
interface Page {
  // => the Playwright locator APIs a test calls, modeled minimally
  url: string; // => page.url()
  input: string; // => the search box's value
  visibleResults: string[]; // => the rendered result list
}

const page: Page = { url: "", input: "", visibleResults: [] }; // => the fresh browser tab

// The smoke steps a Playwright spec would run, as plain functions over the page.
function goto(p: Page, url: string): void {
  p.url = url; // => page.goto(url)
}
function fill(p: Page, text: string): void {
  p.input = text; // => page.fill('#search', text)
}
function clickSearch(p: Page): void {
  // => page.click('button:has-text("Search")'); the handler renders matching results
  const all = ["buy bread", "buy milk", "sell car"]; // => the server's data
  p.visibleResults = all.filter((r) => r.includes(p.input)); // => the filtered result list renders
}

// The test body: navigate -> search -> assert a visible result.
goto(page, "/dashboard"); // => step 1: navigate
fill(page, "buy"); // => step 2: type the query
clickSearch(page); // => step 3: click search
const smokePass = page.visibleResults.some((r) => r.includes("buy bread")); // => assert visible

console.log("navigated to:", page.url); // => Output: navigated to: /dashboard
console.log("e2e smoke pass:", smokePass); // => Output: e2e smoke pass: true
console.log("visible results:", page.visibleResults); // => Output: visible results: [ 'buy bread', 'buy milk' ]
