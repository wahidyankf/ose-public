// => Worked Example 29: a server change that breaks the client is caught at compile time.
// => co-06: with end-to-end inference, renaming a field breaks the client build, not production.
interface V1Output {
  // => version one of the procedure output: name only
  name: string; // => the field v1 clients read
}
interface V2Output {
  // => version two of the procedure output: the field renamed to displayName
  displayName: string; // => the field v2 clients must read instead
}
// => Version one: the old shape the old clients were built against.
function v1Procedure(): V1Output {
  // => the original server: returns the old field
  return { name: "Ada" }; // => old shape
}
// => Version two: the renamed shape that breaks stale readers at compile time.
function v2Procedure(): V2Output {
  // => the renamed server: returns the new field
  return { displayName: "Ada" }; // => new shape: old clients no longer compile
}
function main(): void {
  // => entry point; the old client works against v1 and fails its check against v2
  // => v1 client against the v1 server: the field exists, the read succeeds
  const v1: V1Output = v1Procedure(); // => matched versions
  console.log("v1: name=" + v1.name); // => Output: v1: name=Ada
  // => v2 server output carries only the new field: the old read is gone
  const v2: V2Output = v2Procedure(); // => renamed server
  const hasOldField: boolean = "name" in v2; // => runtime proof the old field is absent
  const hasNewField: boolean = v2.displayName === "Ada"; // => the new field carries the value
  console.log("v2: old=" + String(hasOldField) + " new=" + String(hasNewField)); // => Output: v2: old=false new=true
}
main(); // => run once; a throw exits nonzero
