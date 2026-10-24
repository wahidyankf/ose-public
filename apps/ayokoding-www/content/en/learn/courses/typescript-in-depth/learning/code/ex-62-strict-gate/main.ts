// => Example 62: strict null checks force every absence to be handled, never assumed.
function loudest(names: string[]): string {
  // => total function: always returns a string
  const top = names.map((n) => n.toUpperCase()).pop(); // => WHY strict: pop is string | undefined
  return top ?? "nobody"; // => absence handled at the boundary
} // => end of function loudest(names: string[]): string
console.log(loudest(["ada", "grace"])); // => Output: GRACE
console.log(loudest([])); // => Output: nobody, empty handled too
