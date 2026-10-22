// => Example 43 file 1: a stack with push, pop, and size.
export class Stack {
  // => tiny stack under test
  private items: number[] = []; // => hidden state
  push(n: number): void {
    // => adds on top
    this.items.push(n); // => append
  } // => end of push(n: number): void
  pop(): number | undefined {
    // => removes from the top, empty gives undefined
    return this.items.pop(); // => native pop
  } // => end of pop(): number | undefined
  get size(): number {
    // => visible depth
    return this.items.length; // => current count
  } // => end of get size(): number
} // => end of export class Stack
