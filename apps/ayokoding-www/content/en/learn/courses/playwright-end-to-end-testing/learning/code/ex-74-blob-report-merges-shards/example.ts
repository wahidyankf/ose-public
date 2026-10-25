// Example 74: Blob Report Merges Shards. (co-11: parallel-sharding, co-16: ci-integration)
// => Playwright 1.60.0, docs accessed 2026-10-20; --reporter=blob writes
// => one report per shard, and merge-reports combines them into a single
// => HTML report after every shard finishes; sharding without merging
// => leaves the results scattered across machines:
// =>   real: npx playwright test --reporter=blob then npx playwright merge-reports ./blob-report
interface ShardReport {
  // => one shard's results
  shard: string; // => which shard ran
  passed: number; // => green tests in the shard
  failed: number; // => red tests in the shard
} // => ShardReport is one machine's verdict

async function main(): Promise<void> {
  // => entry point for the merge check
  const one: ShardReport = { shard: "1/2", passed: 40, failed: 0 }; // => machine one: all green
  const two: ShardReport = { shard: "2/2", passed: 39, failed: 1 }; // => machine two: one red
  const merged = mergeBlobs([one, two]); // => real: npx playwright merge-reports
  console.log("total passed: " + String(merged.passed)); // => Output: total passed: 79
  console.log("total failed: " + String(merged.failed)); // => Output: total failed: 1
  console.log("shards merged: " + String(merged.shards)); // => Output: shards merged: 2
  console.log("one report, not two: " + String(merged.passed + merged.failed === 80)); // => Output: one report, not two: true
} // => main ends; two shards became one report

function mergeBlobs(reports: ShardReport[]): { passed: number; failed: number; shards: number } {
  // => stand-in for merge-reports
  const passed: number = reports.reduce((sum, report) => sum + report.passed, 0); // => add up every green
  const failed: number = reports.reduce((sum, report) => sum + report.failed, 0); // => add up every red
  return { passed: passed, failed: failed, shards: reports.length }; // => one combined verdict
} // => mergeBlobs adds the shards into one report

await main(); // => run once; a failure throws and exits nonzero
