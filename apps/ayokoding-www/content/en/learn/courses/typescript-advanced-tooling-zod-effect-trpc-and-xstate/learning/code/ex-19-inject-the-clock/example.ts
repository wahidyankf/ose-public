// => Worked Example 19: services arrive as arguments, so tests can swap them.
// => co-05: in Effect this is Context.Tag plus Layer.provide: dependencies as typed values.
interface Clock {
  // => the service contract: what the effect needs, nothing more
  now(): number; // => current time in milliseconds
}
interface GreetingDeps {
  // => the dependency bundle: every service greet needs, named in one place
  clock: Clock; // => the only service this effect requires
}
function greet(deps: GreetingDeps, name: string): string {
  // => the effect: pure logic, with its needs in the signature
  const hour: number = new Date(deps.clock.now()).getUTCHours(); // => read time through the service
  const part: string = hour < 12 ? "morning" : "day"; // => pure decision on the service value
  return "good " + part + ", " + name; // => output depends on the injected clock
}
function main(): void {
  // => entry point; the same logic runs against a fixed clock and the real one
  // => the fixed clock makes the output deterministic: morning, always
  const fixed: Clock = { now: () => Date.UTC(2026, 0, 1, 8, 0, 0) }; // => 08:00 UTC: morning
  console.log("fixed: " + greet({ clock: fixed }, "Ada")); // => Output: fixed: good morning, Ada
  // => a second fixed clock proves the afternoon branch: still no wall-clock read
  const afternoon: Clock = { now: () => Date.UTC(2026, 0, 1, 15, 0, 0) }; // => 15:00 UTC: afternoon
  console.log("afternoon: " + greet({ clock: afternoon }, "Ada")); // => Output: afternoon: good day, Ada
}
main(); // => run once; a throw exits nonzero
