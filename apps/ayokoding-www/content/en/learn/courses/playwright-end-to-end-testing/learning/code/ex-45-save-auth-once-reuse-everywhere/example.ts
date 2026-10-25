// Example 45: Save Auth Once Reuse Everywhere. (co-12: authentication-state)
// => Playwright 1.60.0, docs accessed 2026-10-20; the setup project runs
// => first (dependencies: ["setup"]), writes one state file per role, and
// => every auth-needing project loads it; no test in the suite types a
// => password:
// =>   real: // playwright.config.ts: { name: "setup", testMatch: /auth\.setup\.ts/ }, then use: { storageState: "admin.json" }
import { readFile, writeFile } from "node:fs/promises"; // => the state file crosses project boundaries

async function main(): Promise<void> {
  // => entry point for the setup-project check
  await writeFile(new URL("./admin.json", import.meta.url), JSON.stringify({ user: "admin", token: "t-1" })); // => the setup project runs first
  const first: string = await loadUser("./admin.json"); // => project one loads the state
  const second: string = await loadUser("./admin.json"); // => project two loads the same state
  console.log("first: " + first); // => Output: first: admin
  console.log("second: " + second); // => Output: second: admin
  console.log("no passwords typed: " + String(first === "admin" && second === "admin")); // => Output: no passwords typed: true
} // => main ends; one setup fed two projects

async function loadUser(path: string): Promise<string> {
  // => stand-in for storageState load
  const raw: string = await readFile(new URL(path, import.meta.url), "utf-8"); // => read the saved session
  return (JSON.parse(raw) as { user: string }).user; // => the logged-in user
} // => loadUser restores the session without logging in

await main(); // => run once; a failure throws and exits nonzero
