// Worked Example 7: Layout nesting order.
// => NusaMart is fictional; every label here is fixed.
// => Layouts nest outside-in: the outermost shell renders first and its
// => hole fills with the next shell down. This example records the render
// => order so the rule is visible: root, then section, then page.

// => A render log: every shell appends its name as it renders.
const order: string[] = []; // => the recorded render order

// => Each shell logs itself, then renders its child into the hole.
function shell(name: string, child: () => string): string {
  // => generic nested shell
  order.push("render " + name); // => record this shell rendering
  return "<" + name + ">" + child() + "</" + name + ">"; // => wrap the child output
} // => end of shell

// => The page logs last: it is the innermost level of the nest.
function page(): string {
  // => innermost page
  order.push("render page"); // => record the page rendering
  return "Teh Melati 100g"; // => the page body
} // => end of page

// => Next.js reads this as app/layout.tsx around app/products/layout.tsx
// => around the page; Start reads it as __root.tsx around a section route.
const html = shell("root", () => shell("shop", page)); // => compose outside-in
console.log(html); // => Output <root><shop>Teh Melati 100g</shop></root>
console.log(order.join(" then ")); // => Output render root then render shop then render page
export {}; // => module scope keeps these names local
