// => Kata 6 solution: one generic getter serves every value type.
function getField<T, K extends keyof T>(obj: T, key: K): T[K] {
  // => WHY generic: key must exist on T
  return obj[key]; // => the lookup cannot miss
} // => end of function getField<T, K extends keyof T>(obj: T, key:
const row = { slug: "kata", hours: 2, done: true }; // => mixed record
console.log(getField(row, "slug"), getField(row, "hours"), getField(row, "done")); // => Output: kata 2 true
