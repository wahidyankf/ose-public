// Kata 05 solution: one shared formatter, silent hydration.
// => NusaMart is fictional; the price here is fixed.
// => The mismatch was never about data: both sides knew 68000, but each
// => formatted it alone. One shared formatter makes both strings equal.
function formatPrice(value: number): string {
  // => the single formatter
  return "<p>" + value.toLocaleString("en-US") + "</p>"; // => shared rule
} // => end of formatPrice
const serverHtml = formatPrice(68000); // => server uses the shared rule
const clientHtml = formatPrice(68000); // => client uses the shared rule
console.log("server: " + serverHtml); // => Output the server string
console.log("client: " + clientHtml); // => Output the identical string
console.log("silent: " + (serverHtml === clientHtml)); // => Output true
export {}; // => module scope keeps these names local
