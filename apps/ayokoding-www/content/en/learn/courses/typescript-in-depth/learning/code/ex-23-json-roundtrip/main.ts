// => Example 23: stringify plus parse round-trips plain data; functions do not survive.
const order = { id: 7, item: "lamp", qty: 2, tags: ["home", "sale"] }; // => plain-data payload
const text = JSON.stringify(order); // => the wire form
console.log(text); // => Output: {"id":7,"item":"lamp","qty":2,"tags":["home","sale"]}
const back: unknown = JSON.parse(text); // => WHY unknown: parse promises nothing
if (typeof back === "object" && back !== null && "qty" in back) {
  // => narrow before touching fields
  console.log("qty:", (back as { qty: unknown }).qty); // => Output: qty: 2
} // => end of if (typeof back === "object" && back !== null && "qt
const prettyLines = JSON.stringify({ a: 1 }, null, 2).split("\n").length; // => two-space indent shape
console.log(prettyLines); // => Output: 3, brace, field, brace
