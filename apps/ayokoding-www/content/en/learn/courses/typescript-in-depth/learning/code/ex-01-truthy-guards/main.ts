// => Example 1: ask the value itself; ?? keeps zeroes that || would drop.
const userName = "ada"; // => non-empty string: truthy, the common case
const nick = ""; // => empty string: falsy, treated as missing here
const count: number | undefined = 0; // => zero is valid data, not absence
if (userName) {
  // => WHY implicit: presence is the whole question
  console.log("name:", userName); // => Output: name: ada, truthy branch ran
} // => end of if (userName)
if (nick) {
  // => falsy, so this branch never runs
  console.log("unreachable"); // => skipped: the empty nick stays silent
} else {
  // => the falsy path: empty means nothing to do
  console.log("nick: missing"); // => Output: nick: missing
} // => end of else
const label = nick || "anonymous"; // => WHY ||: any falsy value falls back
console.log("label:", label); // => Output: label: anonymous
const kept = count ?? -1; // => WHY ??: only null/undefined fall back, zero stays
console.log("kept:", kept); // => Output: kept: 0, the valid zero survived
