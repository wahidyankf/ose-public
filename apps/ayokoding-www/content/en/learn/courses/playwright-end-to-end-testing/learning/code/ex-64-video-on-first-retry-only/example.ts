// Example 64: Video on First Retry Only. (co-06: trace-viewer, co-10: retry-policy)
// => Playwright 1.60.0, docs accessed 2026-10-20; video: "retain-on-failure"
// => and "on-first-retry" record only runs worth watching; recording every
// => passing run wastes disk and nobody watches green videos:
// =>   real: // playwright.config.ts: use: { video: "on-first-retry", trace: "on-first-retry" }
async function main(): Promise<void> {
  // => entry point for the recording check
  const first: string[] = runWith("on-first-retry", [false, true]); // => fails once, then passes
  console.log("videos: " + String(first.length)); // => Output: videos: 1
  console.log("video from retry: " + String(first[0])); // => Output: video from retry: attempt-2.webm
  const green: string[] = runWith("on-first-retry", [true]); // => passes immediately
  console.log("green records nothing: " + String(green.length === 0)); // => Output: green records nothing: true
  console.log("retries worth watching: " + String(first.length === 1 && green.length === 0)); // => Output: retries worth watching: true
} // => main ends; only the interesting run left a video

function runWith(_mode: string, passes: boolean[]): string[] {
  // => stand-in for video: on-first-retry
  const videos: string[] = []; // => the recorded artifacts
  for (let i = 0; i < passes.length; i++) {
    // => one attempt per entry
    if (i > 0) {
      // => a retry runs after the first failure
      videos.push("attempt-" + String(i + 1) + ".webm"); // => record the retry run itself
    } // => the first attempt never records
  } // => every attempt executed
  return videos; // => [] for green runs
} // => runWith records retries only

await main(); // => run once; a failure throws and exits nonzero
