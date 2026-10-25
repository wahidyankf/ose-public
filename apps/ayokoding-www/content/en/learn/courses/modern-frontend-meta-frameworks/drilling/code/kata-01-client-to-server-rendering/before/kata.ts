// Kata 01 starter: a client-rendered shelf with the rows missing.
// => NusaMart is fictional; every product here is fixed.
// => TODO: fetch the rows on the server and render them into the HTML,
// => so the first paint already names a product. See Example 11.
const SHELL = "<ul><li>loading...</li></ul>"; // => shell without rows
console.log("first paint: " + SHELL); // => Output the empty shell
console.log("paints-kopi=" + SHELL.includes("Kopi")); // => Output false: fix this
export {}; // => module scope keeps these names local
