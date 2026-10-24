// Example 36: Locators Live in the Object. (co-04: page-object, co-01: locator)
// => Playwright 1.60.0, docs accessed 2026-10-20; define each locator once
// => in the constructor and reuse it across actions; when the selector
// => changes, exactly one line changes and every test using the object is
// => fixed:
// =>   real: this.search = page.getByRole("searchbox"); // once, then reused
async function main(): Promise<void> {
  // => entry point for the single-definition check
  const defined: string[] = []; // => every locator definition is recorded here
  const page: SearchPage = new SearchPage(defined); // => construction defines the locators
  await page.searchFor("milk"); // => first action reuses the stored locator
  await page.searchFor("bread"); // => second action reuses the same stored locator
  const definitions: number = defined.filter((entry) => entry === "define searchbox").length; // => how many times it was defined
  console.log("definitions: " + String(definitions)); // => Output: definitions: 1
  console.log("uses: " + String(defined.filter((entry) => entry === "use searchbox").length)); // => Output: uses: 2
  console.log("defined once, used twice: " + String(definitions === 1)); // => Output: defined once, used twice: true
} // => main ends; one definition served two searches

class SearchPage {
  // => the page object for the search page
  log: string[]; // => the definition record
  uses: number; // => how many actions ran
  constructor(log: string[]) {
    // => the constructor defines locators once
    this.log = log; // => keep the record
    this.uses = 0; // => no action ran yet
    this.log.push("define searchbox"); // => real: this.search = page.getByRole("searchbox")
  } // => construction ends; the locator is ready
  async searchFor(query: string): Promise<void> {
    // => real: await this.search.fill(query); await this.search.press("Enter")
    this.log.push("use searchbox"); // => the stored locator acts, never redefined
    this.uses += 1; // => count one more action
    void query; // => the query is consumed by the modeled fill
  } // => searchFor reuses without redefining
} // => SearchPage holds one locator for every action

await main(); // => run once; a failure throws and exits nonzero
