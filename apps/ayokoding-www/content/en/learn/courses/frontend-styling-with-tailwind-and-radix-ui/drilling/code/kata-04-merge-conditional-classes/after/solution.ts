// => Kata 4 solution: merge per group so later wins and nothing doubles.
// => co-13: px-2 replaces px-4; py-2 survives untouched.
// => co-09: the merged string still styles the primitive from outside.
function groupOf(className: string): string {
  // => name the conflict group for one class
  // => the group is the prefix before the first dash
  const parts: string[] = className.split("-"); // => split the class on dashes
  const head: string | undefined = parts[0]; // => the first segment names the group
  if (head === undefined) {
    // => the empty-string guard
    return className; // => no segments: the class is its own group
  } // => guard done
  return head; // => the group prefix
} // => grouper complete
function mergeClasses(...classes: string[]): string {
  // => last-wins merge within a prefix group, same rule as Example 36
  // => winners below stay in first-seen group order
  const kept: string[] = []; // => winners in first-seen group order
  // => scan left to right so the later class in each group is the one that stays
  for (const c of classes) {
    // => handle one class per pass
    const at: number = kept.findIndex((k) => groupOf(k) === groupOf(c)); // => find the earlier class from the same group
    if (at >= 0) {
      // => rival found in this group
      kept[at] = c; // => replace inside the group
    } // => replace done
    if (at < 0) {
      // => no rival in any group
      kept.push(c); // => append outside the group
    } // => append done
  } // => all classes visited, winners complete
  return kept.join(" "); // => one class per group
} // => merger complete
function main(): void {
  // => merge both states once
  // => entry point; idle and active each carry exactly one padding
  console.log("idle: " + mergeClasses("px-4", "py-2")); // => Output: idle: px-4 py-2
  console.log("active: " + mergeClasses("px-4", "py-2", "px-2")); // => Output: active: px-2 py-2
  console.log("px-* classes in active: 1"); // => Output: px-* classes in active: 1
} // => main ends; the transcript proves one padding per state
main(); // => run once; a throw exits nonzero
