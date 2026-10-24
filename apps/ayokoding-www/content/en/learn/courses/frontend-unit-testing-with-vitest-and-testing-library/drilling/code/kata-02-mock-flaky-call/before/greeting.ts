// => KATA 02 starting point: the clock decides, the test hopes.
// => Run before noon: green. Run after noon: red. That IS the bug.
export function greeting(): string {
  // => Impure: reads the wall clock, untestable without controlling time.
  const hour = new Date().getHours();
  // => Wall-clock read: the flake source, buried in production code.
  return hour < 12 ? "good morning" : "good afternoon";
  // => Two branches: the test below only ever wanted the first.
}
