// Example 23: Overriding a Fixture Per Test. (co-03: fixture)
// => Playwright 1.60.0, docs accessed 2026-10-20; test.use overrides a
// => fixture for one file or one test (a different user, a wider viewport),
// => while every other test keeps the default; overrides compose without
// => touching the shared fixture definition:
// =>   real: test.use({ viewport: { width: 400, height: 800 } });
interface User {
  // => the user the fixture provides
  name: string; // => who is logged in
  role: string; // => what they may do
} // => User is the overridable value

async function main(): Promise<void> {
  // => entry point for the override check
  const def: User = defaultUser(); // => the shared default: a guest
  console.log("default role: " + def.role); // => Output: default role: viewer
  const admin: User = { ...def, name: "ada", role: "admin" }; // => real: test.use({ user: admin }) for one test
  console.log("override role: " + admin.role); // => Output: override role: admin
  const next: User = defaultUser(); // => the following test gets the default again
  console.log("default restored: " + String(next.role === "viewer")); // => Output: default restored: true
  console.log("override is local: " + String(def.role === "viewer" && admin.role === "admin")); // => Output: override is local: true
} // => main ends; the default survived the override

function defaultUser(): User {
  // => the shared fixture definition
  return { name: "guest", role: "viewer" }; // => a fresh default object every call
} // => defaultUser never returns a shared mutable object

await main(); // => run once; a failure throws and exits nonzero
