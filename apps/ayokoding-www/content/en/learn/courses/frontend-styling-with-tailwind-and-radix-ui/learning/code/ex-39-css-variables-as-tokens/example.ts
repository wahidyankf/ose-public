// => Worked Example 39: CSS variables hold one value per theme.
// => co-14: --color-surface resolves differently under .dark.
// => co-02: each variable below is a design token with two values.
function surfaceToken(theme: string): string {
  // => resolve the surface variable the way the cascade does
  // => one variable below, one value per theme
  const tokens: Record<string, string> = { light: "#ffffff", dark: "#0f172a" }; // => one variable, one value per theme
  const value: string | undefined = tokens[theme]; // => the ancestor theme picks the value
  if (value === undefined) {
    // => the unknown-theme branch
    throw new Error("unknown theme: " + theme); // => unknown themes fail loudly
  } // => unknown-theme branch done
  return value; // => the surface this theme paints
} // => resolver complete
function main(): void {
  // => resolve the same variable twice
  // => entry point; the same variable, two themes
  console.log("light surface: " + surfaceToken("light")); // => Output: light surface: #ffffff
  console.log("dark surface: " + surfaceToken("dark")); // => Output: dark surface: #0f172a
  console.log("stylesheets per theme: 1"); // => Output: stylesheets per theme: 1
} // => main ends; one variable proven twice
main(); // => run once; a throw outside try exits nonzero
