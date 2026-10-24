// Example 60: Component Test in Isolation. (co-13: component-testing)
// => Playwright 1.60.0 experimental component testing, docs accessed
// => 2026-10-20; mount renders one component with no page, no router, no
// => backend: props in, pixels and events out. Fast feedback on the widget,
// => full pages still covered by the end-to-end suite:
// =>   real: await mount(<Counter initial={2} />); await expect(counter).toContainText("2");
interface Counter {
  // => the modeled component instance
  count: number; // => the displayed count
  label: string; // => the rendered text
} // => Counter is props in, text out

async function main(): Promise<void> {
  // => entry point for the mount check
  const counter: Counter = mount({ initial: 2 }); // => real: await mount(<Counter initial={2} />)
  console.log("renders: " + counter.label); // => Output: renders: count: 2
  click(counter); // => real: await counter.getByRole("button", { name: "+" }).click()
  console.log("after click: " + counter.label); // => Output: after click: count: 3
  const zero: Counter = mount({ initial: 0 }); // => a second instance starts independent
  console.log("isolated: " + String(zero.count === 0 && counter.count === 3)); // => Output: isolated: true
  console.log("no page needed: " + String(counter.label.includes("count"))); // => Output: no page needed: true
} // => main ends; the widget proved itself alone

function mount(props: { initial: number }): Counter {
  // => stand-in for mount()
  return { count: props.initial, label: "count: " + String(props.initial) }; // => props render immediately
} // => mount builds one independent instance

function click(counter: Counter): void {
  // => stand-in for clicking inside the component
  counter.count += 1; // => the component updates its own state
  counter.label = "count: " + String(counter.count); // => and re-renders its text
} // => click exercises the component event

await main(); // => run once; a failure throws and exits nonzero
