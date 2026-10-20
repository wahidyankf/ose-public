// Example 62: Turn On Tracing. (co-06: trace-viewer)
// => Playwright 1.60.0, docs accessed 2026-10-20; context.tracing.start
// => records actions, network, console, and DOM snapshots into trace.zip;
// => the trace viewer replays the failure step by step, which beats reading
// => a stack trace alone:
// =>   real: await context.tracing.start({ screenshots: true, snapshots: true });
async function main(): Promise<void> {
  // => entry point for the tracing check
  const trace: string[] = []; // => the recorded event list
  record(trace, "goto /orders"); // => navigation lands in the trace
  record(trace, "click Pay"); // => the click lands in the trace
  record(trace, "assert total"); // => the assertion lands in the trace
  console.log("events: " + String(trace.length)); // => Output: events: 3
  console.log("first: " + String(trace[0])); // => Output: first: goto /orders
  console.log("ordered: " + String(trace.join(" > "))); // => Output: ordered: goto /orders > click Pay > assert total
  console.log("replayable: " + String(trace.length === 3)); // => Output: replayable: true
} // => main ends; the run left a replayable trail

function record(trace: string[], event: string): void {
  // => stand-in for a traced action
  trace.push(event); // => every action appends in order
} // => record keeps the full sequence

await main(); // => run once; a failure throws and exits nonzero
