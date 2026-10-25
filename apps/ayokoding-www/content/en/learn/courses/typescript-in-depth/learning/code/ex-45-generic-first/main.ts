// => Example 45: one generic head() serves every element type; callers keep their types.
function head<T>(items: T[]): T | undefined {
  // => WHY generic: works over every type
  return items[0]; // => first element or undefined when empty
} // => end of function head<T>(items: T[]): T | undefined
console.log(head([1, 2, 3])); // => Output: 1, number preserved
console.log(head(["a", "b"])?.toUpperCase() ?? "empty"); // => Output: A, string preserved
console.log(head([] as number[]) ?? "empty"); // => Output: empty, honest absence
