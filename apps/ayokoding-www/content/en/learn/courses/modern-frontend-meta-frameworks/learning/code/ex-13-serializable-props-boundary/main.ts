// Worked Example 13: Serializable props boundary.
// => NusaMart is fictional; every product and price here is fixed.
// => Server-to-client props cross as JSON: plain data survives, functions
// => and class instances do not. This example draws the boundary by
// => round-tripping one product and naming exactly what arrives.

// => Fixed product: the row the server will serialize.
type Product = { id: string; name: string; price: number }; // => plain data shape
const ROW: Product = { id: "kopi-001", name: "Kopi Toraja 250g", price: 68000 }; // => fictional row

// => The server render may only hand JSON-safe values to the client:
// => a formatter function looks innocent but cannot cross the wire.
const FORMATTER = "(price) => price + ' IDR'"; // => source text, not the function

// => Serialize the row the way the framework does: JSON, then parse back
// => on the client. What survives is the contract; the rest stays behind.
const wire: string = JSON.stringify({ row: ROW, formatter: FORMATTER }); // => the wire payload
const back: { row: Product; formatter: string } = JSON.parse(wire); // => the client copy
console.log("wire: " + wire); // => Output the JSON payload
console.log("row survives: " + (back.row.name === "Kopi Toraja 250g")); // => Output true
console.log("price is number: " + (typeof back.row.price === "number")); // => Output true
console.log("formatter is text: " + (typeof back.formatter === "string")); // => Output true, never callable
export {}; // => module scope keeps these names local
