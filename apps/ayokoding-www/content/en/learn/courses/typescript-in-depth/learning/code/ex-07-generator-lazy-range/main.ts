// => Example 7: generators stream values; nothing is stored until consumed.
function* range(start: number, end: number): Generator<number> {
  // => WHY generator: lazy pausable loop
  for (let n = start; n < end; n++) {
    // => ordinary loop, suspended per yield
    yield n; // => pause here: the caller resumes for the next value
  } // => end of for (let n = start; n < end; n++)
} // => end of function* range(start: number, end: number): Generat
let total = 0; // => running total, no array anywhere
for (const n of range(1, 5)) {
  // => values arrive one at a time
  total += n * n; // => squares accumulate: 1 + 4 + 9 + 16
} // => end of for (const n of range(1, 5))
console.log(total); // => Output: 30
const [a, b] = range(10, 99); // => WHY lazy: destructuring takes two, the rest never runs
console.log(a, b); // => Output: 10 11
