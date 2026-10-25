// => Worked Example 27: portals render overlays outside clipped ancestors.
// => co-10: the overlay's DOM parent is body, whatever the trigger's parent is.
function portalParent(triggerAncestor: string): string {
  // => resolve where the overlay actually mounts
  // => clipped ancestors below lose their grip on the overlay
  if (triggerAncestor === "overflow-hidden") {
    // => the clipped-ancestor branch
    return "body (escapes the clip)"; // => clipped ancestor: portal saves the overlay
  } // => clipped-ancestor branch done
  return "body (default mount)"; // => anywhere else: body is still the mount point
} // => resolver complete, mount always body
function main(): void {
  // => mount from clipped and unclipped triggers
  // => entry point; clipped and unclipped triggers compared
  console.log("trigger inside card: " + portalParent("card")); // => Output: trigger inside card: body (default mount)
  console.log("trigger inside overflow-hidden: " + portalParent("overflow-hidden")); // => Output: trigger inside overflow-hidden: body (escapes the clip)
  console.log("overlay clipped by ancestor: false"); // => Output: overlay clipped by ancestor: false
} // => main ends; the portal proven twice
main(); // => run once; a throw exits nonzero
