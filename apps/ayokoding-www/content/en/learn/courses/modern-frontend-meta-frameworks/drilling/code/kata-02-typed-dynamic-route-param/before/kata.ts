// Kata 02 starter: a stringly-typed detail link anyone can misspell.
// => NusaMart is fictional; the id here is fixed.
// => TODO: route the link through the route table so a wrong path or a
// => missing param fails tsc instead of failing a visitor. See Example 39.
const id = "kopi-001"; // => the product id
const other = "teh-002"; // => a second product id
console.log("link: /products/" + id); // => Output an unchecked string link
console.log("link: /products/" + other); // => Output another unchecked link
export {}; // => module scope keeps these names local
