// Example 75: Retries in CI, Not Locally. (co-10: retry-policy, co-16: ci-integration)
// => Playwright 1.60.0, docs accessed 2026-10-20; retries: process.env.CI
// => ? 2 : 0 gives CI the patience loaded shared runners need while local
// => runs stay strict: a test that needs a retry on a developer's laptop is
// => broken, and the config should say so immediately:
// =>   real: // playwright.config.ts: { retries: process.env.CI ? 2 : 0 }
async function main(): Promise<void> {
  // => entry point for the environment check
  console.log("ci retries: " + String(retriesFor(true))); // => Output: ci retries: 2
  console.log("local retries: " + String(retriesFor(false))); // => Output: local retries: 0
  console.log("ci patient, local strict: " + String(retriesFor(true) === 2 && retriesFor(false) === 0)); // => Output: ci patient, local strict: true
  console.log("env decides: " + String(retriesFor(true) !== retriesFor(false))); // => Output: env decides: true
} // => main ends; one config, two behaviors

function retriesFor(ci: boolean): number {
  // => stand-in for retries: process.env.CI ? 2 : 0
  return ci ? 2 : 0; // => patience for shared runners, strictness for laptops
} // => retriesFor reads the environment like the config does

await main(); // => run once; a failure throws and exits nonzero
