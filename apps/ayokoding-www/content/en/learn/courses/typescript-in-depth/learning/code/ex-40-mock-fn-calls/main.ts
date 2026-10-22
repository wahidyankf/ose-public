// => Example 40 file 1: notify fans out to every registered listener.
export type Listener = (msg: string) => void; // => listener shape
export function notify(all: Listener[], msg: string): void {
  // => fan-out helper
  for (const fn of all) {
    // => every listener runs in order
    fn(msg); // => same message each
  } // => end of for (const fn of all)
} // => end of export function notify(all: Listener[], msg: string)
