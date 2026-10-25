// Worked Example 14: Hydration mismatch warning.
// => NusaMart is fictional; every price here is fixed.
// => Hydration replays the server HTML on the client: when the client
// => computes something different, React warns and repairs. This example
// => models the comparison so the warning rule is explicit: equal strings
// => hydrate silently, different strings warn.

// => The server rendered the price with thousand separators at request time.
const SERVER_HTML = "<p>68,000</p>"; // => fixed server output

// => Case one: the client formats identically, so hydration is silent.
function clientSame(): string {
  // => matching client render
  return "<p>68,000</p>"; // => same string as the server
} // => end of clientSame

// => Case two: the client formats with a locale rule the server lacked,
// => so the strings differ and hydration must warn and repair.
function clientDifferent(): string {
  // => mismatching client render
  return "<p>68000</p>"; // => same value, different string
} // => end of clientDifferent

// => The hydration rule: compare checksums, warn on difference, keep the
// => client string as the repaired truth.
function hydrate(server: string, client: string): string {
  // => hydration comparison
  if (server === client) {
    // => identical strings
    return "hydrate silent"; // => no warning needed
  } // => end of the match branch
  return "hydrate warn: server " + server + " vs client " + client; // => warning plus repair
} // => end of hydrate

console.log(hydrate(SERVER_HTML, clientSame())); // => Output hydrate silent
console.log(hydrate(SERVER_HTML, clientDifferent())); // => Output hydrate warn with both strings
export {}; // => module scope keeps these names local
