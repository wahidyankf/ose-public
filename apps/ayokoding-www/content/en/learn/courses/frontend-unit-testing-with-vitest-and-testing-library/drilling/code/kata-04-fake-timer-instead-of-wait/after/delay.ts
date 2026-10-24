// => KATA 04 target: identical helper, clock-controlled suite.
// => Production code unchanged: the kata moves the clock, not the code.
export function delayedEcho(value: string, ms: number): Promise<string> {
  // => Promise wrapper: resolves with the value after the delay.
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
    // => Same timer: under fake clocks it fires on advance, costing nothing.
  });
}
