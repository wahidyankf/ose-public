// Example 9: Auto-Wait Clicks. (co-02: auto-waiting)
// => Playwright 1.60.0, docs accessed 2026-10-20; before click Playwright
// => waits for actionability: attached, visible, stable (two frames same
// => box), enabled, receiving events. The check retries until every condition
// => holds or the timeout expires; no fixed sleep is ever needed:
// =>   real: await page.getByRole("button", { name: "Pay" }).click();
interface Button {
  // => the modeled button and its readiness over time
  enabledAtTick: number; // => the virtual tick when the button enables
  visible: boolean; // => layout-visible from the first tick
} // => Button carries the conditions the click waits on

async function main(): Promise<void> {
  // => entry point for the actionability check
  const pay: Button = { enabledAtTick: 2, visible: true }; // => disabled until tick 2, then clickable
  const clickedAt: number = autoClick(pay, 5); // => real: .click() with default timeout
  console.log("clicked at tick: " + String(clickedAt)); // => Output: clicked at tick: 2
  console.log("waited, never slept: " + String(clickedAt === 2)); // => Output: waited, never slept: true
  const late: Button = { enabledAtTick: 9, visible: true }; // => enables after the timeout
  const missed: number = autoClick(late, 5); // => the wait gives up at tick 5
  console.log("timeout tick: " + String(missed)); // => Output: timeout tick: -1
  console.log("timeout is -1: " + String(missed === -1)); // => Output: timeout is -1: true
} // => main ends; waiting found tick 2 and refused tick 9

function actionable(button: Button, tick: number): boolean {
  // => stand-in for the actionability checks
  const attached: boolean = true; // => the element exists in the DOM
  const stable: boolean = tick >= 1; // => layout settles after the first tick
  const enabled: boolean = tick >= button.enabledAtTick; // => disabled buttons wait, never click
  return attached && button.visible && stable && enabled; // => every condition must hold at once
} // => actionable mirrors click's preconditions

function autoClick(button: Button, timeoutTicks: number): number {
  // => stand-in for locator.click
  for (let tick = 0; tick <= timeoutTicks; tick++) {
    // => one retry per virtual tick
    if (actionable(button, tick)) {
      // => all conditions hold at this tick
      return tick; // => the click lands now
    } // => not yet; next tick
  } // => every tick exhausted
  return -1; // => real Playwright throws a timeout error naming the condition
} // => autoClick returns the landing tick or -1

await main(); // => run once; a failure throws and exits nonzero
