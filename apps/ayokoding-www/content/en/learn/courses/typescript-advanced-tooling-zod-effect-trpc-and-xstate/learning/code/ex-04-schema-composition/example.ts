// => Worked Example 4: schemas compose by extension and merge.
// => co-01: in Zod this is Base.extend({...}) and SchemaA.merge(SchemaB).
interface Field {
  // => one schema field, reused across all four examples so far
  name: string; // => the key under test
  kind: "string" | "number"; // => the runtime check for that key
}
function keysOf(schema: Field[]): string {
  // => render a schema as its key list for easy comparison
  return schema.map((f) => f.name).join(","); // => names only: kinds are unchanged by composition
}
function main(): void {
  // => entry point; extend adds fields, merge joins two schemas
  // => the base signup schema both later schemas build on
  const base: Field[] = [
    // => two fields every account needs
    { name: "email", kind: "string" }, // => login identity
    { name: "password", kind: "string" }, // => login secret
  ];
  // => extension: base plus timestamps, like Base.extend({ createdAt: z.number() })
  const withTimestamps: Field[] = base.concat([{ name: "createdAt", kind: "number" }]); // => concat, never mutate
  console.log("extended: " + keysOf(withTimestamps) + " (base=" + String(base.length) + ")"); // => Output: extended: email,password,createdAt (base=2)
  // => merge: profile fields joined with preferences, like Profile.merge(Preferences)
  const profile: Field[] = [{ name: "displayName", kind: "string" }]; // => left side of the merge
  const preferences: Field[] = [{ name: "theme", kind: "string" }]; // => right side of the merge
  const merged: Field[] = profile.concat(preferences); // => every field from both sides
  console.log("merged: " + keysOf(merged)); // => Output: merged: displayName,theme
  // => the base is untouched: composition copies, it never edits in place
  console.log("base intact: " + keysOf(base)); // => Output: base intact: email,password
}
main(); // => run once; a throw exits nonzero
