// => Worked Example 5: type utilities compose size, weight, and rhythm.
// => co-01: three classes carry the whole type spec for this heading.
interface TypeSpec {
  // => the resolved spec: size, weight, line height
  sizeRem: number; // => the resolved size in rems
  weight: number; // => the resolved weight number
  leadingRem: number; // => the resolved line height in rems
} // => shape complete
function resolveType(classes: string[]): TypeSpec {
  // => map three utilities to numbers the way the engine would
  // => start from the body-text default below
  const spec: TypeSpec = { sizeRem: 1, weight: 400, leadingRem: 1.5 }; // => the body-text default
  if (classes.includes("text-lg")) {
    // => the size branch
    spec.sizeRem = 1.125; // => text-lg steps size up one rung
  } // => size branch done
  if (classes.includes("font-semibold")) {
    // => the weight branch
    spec.weight = 600; // => font-semibold pins the weight
  } // => weight branch done
  if (classes.includes("leading-7")) {
    // => the rhythm branch
    spec.leadingRem = 1.75; // => leading-7 sets the rhythm
  } // => rhythm branch done
  return spec; // => the composed spec, no stylesheet lookup needed
} // => resolver complete
function main(): void {
  // => resolve the lesson heading once
  // => entry point; the transcript is the resolved heading spec
  const spec: TypeSpec = resolveType(["text-lg", "font-semibold", "leading-7"]); // => the heading from the lesson
  console.log("size: " + String(spec.sizeRem) + "rem"); // => Output: size: 1.125rem
  console.log("weight: " + String(spec.weight)); // => Output: weight: 600
  console.log("leading: " + String(spec.leadingRem) + "rem"); // => Output: leading: 1.75rem
} // => main ends; the spec is fully resolved
main(); // => run once; a throw exits nonzero
