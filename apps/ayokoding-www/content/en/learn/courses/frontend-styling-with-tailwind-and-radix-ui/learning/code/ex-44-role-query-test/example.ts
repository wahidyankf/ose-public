// => Worked Example 44: tests find elements by role, never by class.
// => co-15: getByRole queries the accessibility tree the user experiences.
interface TreeNode {
  // => one accessible node: its role and its name
  role: string; // => the queried role
  name: string; // => the accessible name
} // => shape complete
const TREE: TreeNode[] = [
  // => the accessibility tree under test
  { role: "dialog", name: "Settings" }, // => the settings dialog
  { role: "button", name: "Save" }, // => the save button
]; // => two nodes, both named
function getByRole(role: string, name?: string): string {
  // => query the tree the way the testing library does
  // => role first below, then the accessible name
  const hit: TreeNode | undefined = TREE.find((n) => n.role === role && (name === undefined || n.name === name)); // => role first, then the accessible name
  if (hit === undefined) {
    // => the missing-role branch
    throw new Error("role not found: " + role); // => missing role fails the test, loudly
  } // => missing-role branch done
  return hit.role + " '" + hit.name + "'"; // => the found element, identified accessibly
} // => querier complete
function main(): void {
  // => query twice, miss once
  // => entry point; two hits and one loud miss
  console.log("found: " + getByRole("dialog", "Settings")); // => Output: found: dialog 'Settings'
  console.log("found: " + getByRole("button")); // => Output: found: button 'Save'
  try {
    // => the miss branch
    getByRole("menu"); // => no menu lives in this tree
  } catch {
    // => misses land here
    console.log("menu missing: throws"); // => Output: menu missing: throws
  } // => miss handled, loud as required
} // => main ends; meaning-queries proven three ways
main(); // => run once; an uncaught throw exits nonzero
