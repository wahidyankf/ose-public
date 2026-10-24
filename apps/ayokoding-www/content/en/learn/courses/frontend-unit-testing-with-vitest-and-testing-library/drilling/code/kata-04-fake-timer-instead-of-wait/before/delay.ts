// => KATA 04 starting point: wall-clock waiting, 300 honest milliseconds.
// => The delay is real, the wait is real, the suite pays full price.
export function delayedEcho(value: string, ms: number): Promise<string> {
  // => Promise wrapper: resolves with the value after the delay.
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
    // => Real timer: the suite below waits it out, millisecond for millisecond.
  });
}
