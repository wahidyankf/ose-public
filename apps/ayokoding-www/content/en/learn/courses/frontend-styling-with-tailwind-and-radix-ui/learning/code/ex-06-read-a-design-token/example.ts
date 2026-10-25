// => Worked Example 6: a token is a name with exactly one value.
// => co-02: blue-600 never means two blues; the map below enforces that.
const TOKENS: Record<string, string> = { "blue-600": "#2563eb", "slate-900": "#0f172a" }; // => the token table: two names, two values
function token(name: string): string {
  // => resolve a token the way the theme engine does
  // => one lookup below, no fallback chain
  const value: string | undefined = TOKENS[name]; // => one lookup, no fallback chain
  if (value === undefined) {
    // => the unknown-name branch
    throw new Error("unknown token: " + name); // => unknown names fail loudly, never silently
  } // => unknown-name branch done
  return value; // => the single value this name owns
} // => resolver complete
function main(): void {
  // => resolve two tokens and one miss
  // => entry point; known names resolve, unknown names throw
  console.log("blue-600 = " + token("blue-600")); // => Output: blue-600 = #2563eb
  console.log("slate-900 = " + token("slate-900")); // => Output: slate-900 = #0f172a
  try {
    // => the miss branch
    token("blue-650"); // => a near-miss name, never a token
  } catch {
    // => misses land here
    console.log("blue-650 throws: true"); // => Output: blue-650 throws: true
  } // => miss handled, loud as required
} // => main ends; strictness proven twice
main(); // => run once; a throw outside try exits nonzero
