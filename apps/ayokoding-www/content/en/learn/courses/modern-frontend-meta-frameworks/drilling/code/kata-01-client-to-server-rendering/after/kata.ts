// Kata 01 solution: render the shelf on the server.
// => NusaMart is fictional; every product and price here is fixed.
// => The loader resolves before render, so the first HTML already carries
// => the rows: the same fix Example 11 demonstrates on both frameworks.
const ROWS = ["Kopi Toraja 250g 68000", "Teh Melati 100g 32000"]; // => fixed rows
function serverShelf(): string {
  // => server render
  return "<ul><li>" + ROWS.join("</li><li>") + "</li></ul>"; // => rows inside first HTML
} // => end of serverShelf
const html = serverShelf(); // => render before sending
console.log("first paint: " + html); // => Output HTML with rows inside
console.log("paints-kopi=" + html.includes("Kopi")); // => Output true
export {}; // => module scope keeps these names local
