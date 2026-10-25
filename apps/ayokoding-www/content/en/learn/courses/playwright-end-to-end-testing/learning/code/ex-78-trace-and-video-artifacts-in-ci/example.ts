// Example 78: Trace and Video Artifacts in CI. (co-16: ci-integration, co-06: trace-viewer)
// => Playwright 1.60.0, docs accessed 2026-10-20; keep screenshots, traces,
// => and videos as CI artifacts (actions/upload-artifact) so a red build
// => carries its own evidence; debugging starts from the artifact, not from
// => re-running the suite and hoping:
// =>   real: uses: actions/upload-artifact@v4, with: { name: playwright-report, path: playwright-report/ }
async function main(): Promise<void> {
  // => entry point for the artifact check
  const failed = true; // => this build went red
  const kept: string[] = collectArtifacts(failed); // => real: upload-artifact on failure
  console.log("artifacts: " + kept.join(",")); // => Output: artifacts: trace.zip,video.webm,screenshot.png
  console.log("evidence kept: " + String(kept.length === 3)); // => Output: evidence kept: true
  const green: string[] = collectArtifacts(false); // => green builds keep nothing
  console.log("green keeps nothing: " + String(green.length === 0)); // => Output: green keeps nothing: true
  console.log("debug from evidence: " + String(kept.includes("trace.zip"))); // => Output: debug from evidence: true
} // => main ends; red builds explain themselves

function collectArtifacts(failed: boolean): string[] {
  // => stand-in for the upload step
  if (!failed) {
    // => green builds store no evidence
    return []; // => nothing to debug
  } // => red branch below
  return ["trace.zip", "video.webm", "screenshot.png"]; // => the three evidence files
} // => collectArtifacts keeps evidence only for red builds

await main(); // => run once; a failure throws and exits nonzero
