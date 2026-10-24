// => Example 3: for-of plus entries plus destructuring replaces index loops.
const tasks = ["write", "test", "review"]; // => the list drives the loop
for (const [index, task] of tasks.entries()) {
  // => WHY entries: index and item arrive paired
  console.log(index + 1, task); // => Output: 1 write / 2 test / 3 review
} // => end of for (const [index, task] of tasks.entries())
const scores = new Map<string, number>([
  ["ada", 9],
  ["grace", 10],
]); // => name-to-score lookup
for (const [who, score] of scores) {
  // => maps iterate entries by default
  console.log(who, score); // => Output: ada 9, then grace 10
} // => end of for (const [who, score] of scores)
