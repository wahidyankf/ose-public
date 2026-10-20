// Example 77: Headed Versus Headless in CI. (co-16: ci-integration, co-07: visual-comparison)
// => Playwright 1.60.0, docs accessed 2026-10-20; CI runs headless (no
// => display server, faster, the only option in containers); headed runs are
// => for local debugging with --headed while watching. Screenshots differ
// => subtly between modes, so baselines are recorded in the mode CI uses:
// =>   real: npx playwright test (headless) versus npx playwright test --headed (watching)
async function main(): Promise<void> {
  // => entry point for the mode check
  console.log("ci mode: " + modeFor(true)); // => Output: ci mode: headless
  console.log("local debug mode: " + modeFor(false, true)); // => Output: local debug mode: headed
  console.log("local default mode: " + modeFor(false, false)); // => Output: local default mode: headless
  console.log("baselines match ci: " + String(modeFor(true) === "headless")); // => Output: baselines match ci: true
} // => main ends; headless is the default everywhere but debugging

function modeFor(ci: boolean, headed = false): string {
  // => stand-in for the launch mode
  if (headed) {
    // => the developer asked to watch
    return "headed"; // => a visible browser, local only
  } // => headless branches below
  void ci; // => CI always runs headless; local defaults to it too
  return "headless"; // => no display server needed
} // => modeFor picks the browser mode

await main(); // => run once; a failure throws and exits nonzero
