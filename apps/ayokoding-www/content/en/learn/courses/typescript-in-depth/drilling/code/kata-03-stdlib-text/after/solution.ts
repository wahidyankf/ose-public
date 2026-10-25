// => Kata 3 solution: URLSearchParams parses once, correctly, including repeats.
function getTags(query: string): string[] {
  // => all tag values in order
  const params = new URLSearchParams(query); // => WHY stdlib: encoding handled once
  return params.getAll("tag"); // => repeats kept
} // => end of function getTags(query: string): string[]
const tags = getTags("tag=ts&tag=node+%26+npm&page=2"); // => encoded ampersand inside
console.log(tags.join(",")); // => Output: ts,node & npm
console.log(tags.length); // => Output: 2
