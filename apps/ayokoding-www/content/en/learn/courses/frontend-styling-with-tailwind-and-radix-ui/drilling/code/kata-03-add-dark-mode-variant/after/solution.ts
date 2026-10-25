// => Kata 3 solution: pair every surface with its dark variant.
// => co-14: dark: utilities answer to the one .dark toggle from Example 40.
// => co-02: slate-900 and slate-100 are tokens, not one-off hex.
function cardClasses(theme: string): string {
  // => resolve the card classes for one theme
  // => fixed: the theme argument selects the variant, light stays default
  const base: string = "rounded-lg bg-white p-6 dark:bg-slate-900 dark:text-slate-100"; // => both themes ship in one attribute
  if (theme === "dark") {
    // => the dark branch
    return base + " (rendered under .dark)"; // => dark renders under the ancestor toggle
  } // => dark branch done
  return base; // => light renders as-is
} // => resolver complete, both themes covered
function main(): void {
  // => render both themes once
  // => entry point; one component, two honest renders
  console.log("light: " + cardClasses("light")); // => Output: light: rounded-lg bg-white p-6 dark:bg-slate-900 dark:text-slate-100
  console.log("dark: " + cardClasses("dark")); // => Output: dark: rounded-lg bg-white p-6 dark:bg-slate-900 dark:text-slate-100 (rendered under .dark)
  console.log("stylesheets added: 0"); // => Output: stylesheets added: 0
} // => main ends; the transcript proves one attribute themes twice
main(); // => run once; a throw exits nonzero
