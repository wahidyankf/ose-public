// Worked Example 12: Server render versus client render.
// => NusaMart is fictional; every product and price here is fixed.
// => The same shelf reads two ways: server-rendered HTML arrives full, while
// => a client-rendered shell arrives empty and fills in after its fetch.
// => First paint tells them apart.

// => Fixed catalog: the only rows either render may show.
const NAMES = ["Kopi Toraja 250g", "Teh Melati 100g"]; // => two fictional goods

// => Server render: data resolves before HTML, so the first bytes are full.
function serverRender(): string {
  // => server-side render
  return "<ul><li>" + NAMES.join("</li><li>") + "</li></ul>"; // => rows inside first HTML
} // => end of serverRender

// => Client render: the shell ships without rows, then a fetch fills the
// => same list in; crawlers and slow networks see the shell first.
function clientShell(): string {
  // => client-side shell
  return "<ul><li>loading...</li></ul>"; // => placeholder, no rows yet
} // => end of clientShell

// => The client's late fetch resolves the same rows the server had first.
function clientHydrated(): string {
  // => client after fetch
  return "<ul><li>" + NAMES.join("</li><li>") + "</li></ul>"; // => rows arrive late
} // => end of clientHydrated

console.log("server first paint: " + serverRender()); // => Output HTML with rows inside
console.log("client first paint: " + clientShell()); // => Output shell without rows
console.log("client after fetch: " + clientHydrated()); // => Output HTML with rows, late
console.log("server had rows first: " + serverRender().includes("Kopi")); // => Output true
console.log("client had rows first: " + clientShell().includes("Kopi")); // => Output false
export {}; // => module scope keeps these names local
