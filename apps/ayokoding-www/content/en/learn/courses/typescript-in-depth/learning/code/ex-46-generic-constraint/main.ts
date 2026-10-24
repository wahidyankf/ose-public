// => Example 46: extends plus keyof keep generics honest about what they touch.
function getField<T, K extends keyof T>(obj: T, key: K): T[K] {
  // => WHY constraint: key must exist on T
  return obj[key]; // => the lookup cannot miss
} // => end of function getField<T, K extends keyof T>(obj: T, key:
const course = { slug: "ts-in-depth", hours: 6 }; // => fixed record
console.log(getField(course, "slug")); // => Output: ts-in-depth
console.log(getField(course, "hours") + 1); // => Output: 7, number known
function longest<T extends { length: number }>(a: T, b: T): T {
  // => WHY structural bound: only length needed
  return a.length >= b.length ? a : b; // => works for strings, arrays, and more
} // => end of function longest<T extends { length: number }>(a: T,
console.log(longest("ada", "grace")); // => Output: grace
console.log(longest([1, 2], [1])); // => Output: 1,2
