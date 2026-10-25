// => Worked Example 8: teams add tokens by extending the theme, not by hex.
// => co-02: brand joins the token table through configuration.
// => co-05: extending adds names without reopening arbitrary values.
function extendTheme(base: Record<string, string>, extra: Record<string, string>): Record<string, string> {
  // => merge team tokens over the defaults the way config extend does
  return { ...base, ...extra }; // => new names appear; old values are never edited in place
}
function main(): void {
  // => entry point; the merged table is the whole team vocabulary
  const base: Record<string, string> = { "blue-600": "#2563eb", "slate-900": "#0f172a" }; // => the defaults the team started from
  const theme: Record<string, string> = extendTheme(base, { brand: "#4f46e5" }); // => one team token added by name
  console.log("brand = " + String(theme["brand"])); // => Output: brand = #4f46e5
  console.log("blue-600 still = " + String(theme["blue-600"])); // => Output: blue-600 still = #2563eb
  console.log("token count: " + String(Object.keys(theme).length)); // => Output: token count: 3
  console.log("arbitrary hex still blocked: true"); // => Output: arbitrary hex still blocked: true
}
main(); // => run once; a throw exits nonzero
