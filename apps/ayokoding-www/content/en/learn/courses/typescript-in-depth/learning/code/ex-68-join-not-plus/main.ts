// => Example 68: join builds big strings in one pass; += copies on every line.
const names = ["ada", "grace", "margaret", "alan"]; // => fixed roster
const joined = names.join(", "); // => WHY join: one allocation for the whole string
console.log(joined); // => Output: ada, grace, margaret, alan
let plus = ""; // => the accumulator to avoid
for (const n of names) {
  // => same roster, plus-equals loop
  plus += (plus === "" ? "" : ", ") + n; // => copies the growing string per item
} // => end of for (const n of names)
console.log(plus === joined); // => Output: true, same text, wasted copies
console.log(joined.length); // => Output: 26
