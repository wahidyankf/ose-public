// => KATA 02 target: the hour is a parameter, the clock stays outside.
// => Pure core, impure shell: test the core, wire the shell once.
export function greetingAt(hour: number): string {
  // => Pure: same input, same output, no clock, no flake, ever.
  return hour < 12 ? "good morning" : "good afternoon";
  // => Branch on the argument: both paths reachable in microseconds.
}

export function greeting(): string {
  // => Shell: the only impure line, too thin to hide a bug.
  return greetingAt(new Date().getHours());
  // => Clock read isolated: one call site, zero logic around it.
}
