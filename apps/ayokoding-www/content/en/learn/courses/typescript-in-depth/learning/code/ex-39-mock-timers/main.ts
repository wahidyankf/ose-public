// => Example 39 file 1: a debounce that restarts its wait on every call.
export function debounce(fn: () => void, ms: number): () => void {
  // => trailing-edge debounce
  let timer: ReturnType<typeof setTimeout> | undefined; // => pending wait handle
  return () => {
    // => each call restarts the wait
    if (timer !== undefined) {
      // => a pending wait exists
      clearTimeout(timer); // => cancel it
    } // => end of if (timer !== undefined)
    timer = setTimeout(fn, ms); // => schedule fresh
  }; // => end of return () =>
} // => end of export function debounce(fn: () => void, ms: number)
