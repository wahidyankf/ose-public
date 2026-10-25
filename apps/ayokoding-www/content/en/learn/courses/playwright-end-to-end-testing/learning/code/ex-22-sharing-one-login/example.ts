// Example 22: Sharing One Login. (co-12: authentication-state, co-03: fixture)
// => Playwright 1.60.0, docs accessed 2026-10-20; logging in once per test
// => is slow and rate-limited; the setup-project pattern logs in a single
// => time, saves storage state, and every later test loads it instead:
// =>   real: await page.context().storageState({ path: "admin.json" });
import { readFile, writeFile } from "node:fs/promises"; // => the state file is the sharing mechanism

async function main(): Promise<void> {
  // => entry point for the login-sharing check
  const logins: number[] = [0]; // => how many real logins happened, by reference
  await loginOnce(logins); // => the setup project logs in
  await loginOnce(logins); // => the second test reuses the saved state
  console.log("real logins: " + String(logins[0])); // => Output: real logins: 1
  const state: string = await readFile(new URL("./state.json", import.meta.url), "utf-8"); // => storageState on disk
  const parsed = JSON.parse(state) as { user: string }; // => the saved session
  console.log("saved user: " + parsed.user); // => Output: saved user: admin
  console.log("one login serves all: " + String(logins[0] === 1 && parsed.user === "admin")); // => Output: one login serves all: true
} // => main ends; the password was typed once

async function loginOnce(counter: number[]): Promise<void> {
  // => stand-in for the setup project plus storageState load
  try {
    // => reuse wins when a state file already exists
    await readFile(new URL("./state.json", import.meta.url), "utf-8"); // => a saved session exists
  } catch {
    // => no state file yet: this is the first run
    counter[0] = (counter[0] as number) + 1; // => one real login happens here
    await writeFile(new URL("./state.json", import.meta.url), JSON.stringify({ user: "admin" })); // => save storageState
  } // => either reused or freshly saved
} // => loginOnce logs in at most once

await main(); // => run once; a failure throws and exits nonzero
