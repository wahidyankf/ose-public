// Coverage gate: reads the JSON summary, enforces the floor.
// => Plain Node script: no dependencies, runs anywhere node runs.
// => Ten lines that turn a report into a build decision.
import { readFileSync } from "node:fs";
// => Sync read: the summary file exists by the time this script runs.

const FLOOR = 80;
// => Floor at 80, below today's 100: new code must keep up, noise tolerated.
// => Raise deliberately as the average climbs: progress, ratcheted.

const summary = JSON.parse(
  readFileSync(new URL("../coverage/coverage-summary.json", import.meta.url)),
  // => Summary path relative to this script: harness copy or lab, both work.
);
// => Lines percentage from the totals row: the single number the gate guards.
const lines = summary.total.lines.pct;
// => Lines percentage from the totals row: the single number the gate guards.

if (lines < FLOOR) {
  // => Below floor: nonzero exit fails the run, CI goes red with a reason.
  console.error(`coverage lines ${lines}% below floor ${FLOOR}%`);
  process.exit(1);
}
console.log(`PASS: lines ${lines}% >= floor ${FLOOR}%`);
// => At or above: the PASS line names the number and the floor it cleared.
