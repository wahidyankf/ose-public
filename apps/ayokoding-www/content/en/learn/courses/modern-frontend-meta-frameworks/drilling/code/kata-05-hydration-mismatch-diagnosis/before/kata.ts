// Kata 05 starter: a price the server and client format differently.
// => NusaMart is fictional; the price here is fixed.
// => TODO: share one formatter between server and client so hydration goes
// => silent. See Example 14.
const SERVER_HTML: string = "<p>68,000</p>"; // => server format with separator
const clientHtml: string = "<p>68000</p>"; // => client format without separator
console.log("server: " + SERVER_HTML); // => Output the server string
console.log("client: " + clientHtml); // => Output the client string
console.log("silent: " + (SERVER_HTML === clientHtml)); // => Output false: fix this
export {}; // => module scope keeps these names local
