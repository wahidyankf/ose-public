// Example 17: Test Isolation With Fresh Contexts. (co-09: test-isolation)
// => Playwright 1.60.0, docs accessed 2026-10-20; each test gets its own
// => browser context (cookies, storage, history start empty), so a login in
// => one test can never leak into the next; sharing is opt-in via storage
// => state, never accidental:
// =>   real: test.use({ storageState: "admin.json" }) for the tests that share
import { readFile, writeFile } from "node:fs/promises"; // => readFile and writeFile persist the state file

interface Context {
  // => the modeled browser context
  cookies: Record<string, string>; // => this context's private cookie jar
} // => Context isolates storage the way Playwright contexts do

async function main(): Promise<void> {
  // => entry point for the isolation check
  const first: Context = { cookies: {} }; // => test one starts with an empty jar
  first.cookies["session"] = "abc"; // => test one logs in
  const second: Context = { cookies: {} }; // => test two starts empty too
  console.log("second sees session: " + String("session" in second.cookies)); // => Output: second sees session: false
  await writeFile(new URL("./state.json", import.meta.url), JSON.stringify(first.cookies)); // => opt-in sharing writes state
  const saved: string = await readFile(new URL("./state.json", import.meta.url), "utf-8"); // => the next test reads it back
  const third: Context = { cookies: JSON.parse(saved) as Record<string, string> }; // => storageState loads the session
  console.log("shared sees session: " + String(third.cookies["session"])); // => Output: shared sees session: abc
  console.log("isolation is default: " + String(!("session" in second.cookies))); // => Output: isolation is default: true
  console.log("sharing is opt-in: " + String(third.cookies["session"] === "abc")); // => Output: sharing is opt-in: true
} // => main ends; fresh by default, shared only when asked

await main(); // => run once; a failure throws and exits nonzero
