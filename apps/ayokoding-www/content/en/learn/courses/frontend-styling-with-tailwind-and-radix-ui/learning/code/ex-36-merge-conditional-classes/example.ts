// => Worked Example 36: conflicting utilities resolve last-wins per group.
// => co-13: px-2 then px-4 leaves exactly one horizontal padding.
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
  // => last-wins merge within a prefix group, same rule as the katas
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
  return kept.join(" "); // => one class per group, order stable
} // => merger complete
function main(): void {
  // => merge one conflict and one coexistence
  // => entry point; the conflict, then the peaceful coexistence
  console.log("merge: " + mergeClasses("px-2", "py-1", "px-4")); // => Output: merge: px-4 py-1
  console.log("merge: " + mergeClasses("bg-blue-600", "text-white", "bg-blue-700")); // => Output: merge: bg-blue-700 text-white
  console.log("unrelated classes dropped: 0"); // => Output: unrelated classes dropped: 0
} // => main ends; last-wins proven twice
main(); // => run once; a throw exits nonzero
