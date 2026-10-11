// Example 51: Utility-First Styling of a Component. (co-29)
//
// Utility-first CSS (Tailwind) styles a component by composing many single-purpose utility
// classes directly in the markup, instead of writing a custom class with hand-written rules. The
// result is the same rendered styles, expressed as a known set of reusable primitives.
//
// Note: Tailwind = "combining many single-purpose ... utility classes directly in
// your markup." Source: Tailwind docs
// (https://tailwindcss.com/docs/styling-with-utility-classes).

// A small registry of utility classes and the CSS declarations each stands for.
const utilities: Record<string, string> = {
  // => each utility is ONE concern; composing them builds the component's styles
  flex: "display: flex", // => layout primitive
  "items-center": "align-items: center", // => alignment primitive
  "gap-2": "gap: 0.5rem", // => spacing primitive
  "px-4": "padding-left: 1rem; padding-right: 1rem", // => horizontal padding primitive
};

// className is the utility classes composed in the markup (what the author wrote).
const className = "flex items-center gap-2 px-4"; // => a button's class list, utility-first
// => there is NO custom ".button" class; the styles come entirely from composed utilities

// resolveUtilities expands the composed class list into the actual CSS declarations.
function resolveUtilities(classAttr: string): string[] {
  // => co-29: the rendered styles are the union of the composed utilities' declarations
  return classAttr
    .split(/\s+/) // => each token is one utility
    .filter((token) => token in utilities) // => only known utilities resolve
    .map((token) => utilities[token]); // => the declaration(s) each utility contributes
}

const styles = resolveUtilities(className); // => the resolved CSS for this component

console.log("applied styles:", styles); // => Output: applied styles: [ 'display: flex', 'align-items: center', 'gap: 0.5rem', ... ]
console.log("utility count:", styles.length); // => Output: utility count: 4
