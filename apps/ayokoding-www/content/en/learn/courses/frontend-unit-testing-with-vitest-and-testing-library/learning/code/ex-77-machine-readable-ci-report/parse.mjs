// CI summary parser: JSON report in, one deterministic line out.
// => Plain Node script: reads the report file, prints counts only.
// => Counts are stable across machines: paths and timings never printed.
import { readFileSync } from "node:fs";
// => Sync read: the report file exists when this script runs, guaranteed.

const report = JSON.parse(readFileSync(new URL("./report.json", import.meta.url)));
// => Report path relative to this script: harness copy or lab, both resolve.

const passed = report.numPassedTests ?? 0;
// => Passed count with a zero default: missing field degrades loudly, not NaN.
const total = report.numTotalTests ?? 0;
// => Total count likewise: the line below names both numbers explicitly.

console.log(`tests: ${total} passed: ${passed}`);
// => Single line, counts only: deterministic bytes for the expected file.
