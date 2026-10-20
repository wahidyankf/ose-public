// Example 46: Setup Project Writes Storage State. (co-12: authentication-state)
// => Playwright 1.60.0, docs accessed 2026-10-20; auth.setup.ts performs
// => the real login once per run and writes the storage state file other
// => projects depend on; when login fails, the setup project fails fast and
// => no dependent test wastes time:
// =>   real: // auth.setup.ts: await page.getByLabel("Password").fill(SECRET); await page.context().storageState({ path: "admin.json" });
import { writeFile, readFile } from "node:fs/promises"; // => the state file is the setup project's output

async function main(): Promise<void> {
  // => entry point for the setup-project check
  const ok: boolean = await setupProject("ada", "s3cret"); // => correct credentials
  console.log("setup ok: " + String(ok)); // => Output: setup ok: true
  const raw: string = await readFile(new URL("./setup-state.json", import.meta.url), "utf-8"); // => the file setup wrote
  console.log("state user: " + String((JSON.parse(raw) as { user: string }).user)); // => Output: state user: ada
  const failed: boolean = await setupProject("ada", "wrong"); // => wrong password fails fast
  console.log("setup fails fast: " + String(!failed)); // => Output: setup fails fast: true
  console.log("dependents reuse file: " + String(ok && raw.includes("ada"))); // => Output: dependents reuse file: true
} // => main ends; one login wrote the file every project needs

async function setupProject(user: string, pass: string): Promise<boolean> {
  // => stand-in for auth.setup.ts
  if (pass !== "s3cret") {
    // => the password is wrong
    return false; // => setup fails; dependent projects never start
  } // => correct credentials below
  await writeFile(new URL("./setup-state.json", import.meta.url), JSON.stringify({ user: user })); // => write storageState
  return true; // => dependents may run
} // => setupProject logs in once and records it

await main(); // => run once; a failure throws and exits nonzero
