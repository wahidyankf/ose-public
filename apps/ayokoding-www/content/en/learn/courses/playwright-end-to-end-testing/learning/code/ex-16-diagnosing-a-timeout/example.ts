// Example 16: Diagnosing a Timeout. (co-15: flakiness-diagnosis, co-02: auto-waiting)
// => Playwright 1.60.0, docs accessed 2026-10-20; a timeout error names the
// => exact condition that never held (attached? visible? stable? enabled?),
// => so the fix targets the app or the locator instead of the timeout value:
// =>   real: npx playwright test --debug (steps into the failing action)
interface Diagnosis {
  // => which condition held and which never did
  attached: boolean; // => the element exists in the DOM
  visible: boolean; // => layout gives it a box
  enabled: boolean; // => it can receive events
  culprit: string; // => the first condition that never held
} // => Diagnosis turns a red test into a named cause

async function main(): Promise<void> {
  // => entry point for the timeout diagnosis
  const report: Diagnosis = diagnose({ attached: true, visible: true, enabled: false }); // => a disabled Pay button
  console.log("attached: " + String(report.attached)); // => Output: attached: true
  console.log("visible: " + String(report.visible)); // => Output: visible: true
  console.log("enabled: " + String(report.enabled)); // => Output: enabled: false
  console.log("culprit: " + report.culprit); // => Output: culprit: disabled button never enabled
  console.log("fix the app, not the timeout: " + String(report.culprit !== "timeout too short")); // => Output: fix the app, not the timeout: true
} // => main ends; the disabled button is the cause, not the clock

function diagnose(seen: { attached: boolean; visible: boolean; enabled: boolean }): Diagnosis {
  // => stand-in for reading the error
  if (!seen.attached) {
    // => the locator matches nothing at all
    return { attached: false, visible: false, enabled: false, culprit: "locator matches zero elements" }; // => fix the selector
  } // => attached, keep looking
  if (!seen.visible) {
    // => present but hidden
    return { attached: true, visible: false, enabled: false, culprit: "element stays hidden" }; // => fix visibility or timing
  } // => visible, keep looking
  if (!seen.enabled) {
    // => visible but disabled
    return { attached: true, visible: true, enabled: false, culprit: "disabled button never enabled" }; // => fix the app state
  } // => every condition holds
  return { attached: true, visible: true, enabled: true, culprit: "timeout too short" }; // => only then raise the timeout
} // => diagnose walks the conditions in order

await main(); // => run once; a failure throws and exits nonzero
