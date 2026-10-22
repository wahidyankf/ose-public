// => Example 17: parse once at the boundary; the core trusts the parsed type.
interface User {
  // => the trusted core shape
  login: string; // => already trimmed and checked
  age: number; // => already a finite number
} // => end of interface User
function parseUser(raw: unknown): User {
  // => WHY parse: unknown enters, User leaves
  if (typeof raw !== "object" || raw === null) {
    // => shape gate first
    throw new Error("user must be an object"); // => rejects primitives and null
  } // => end of if (typeof raw !== "object" || raw === null)
  const { login, age } = raw as { login?: unknown; age?: unknown }; // => pull the fields loosely
  if (typeof login !== "string" || login.trim() === "") {
    // => login policy in one test
    throw new Error("login must be a non-empty string"); // => names the violated rule
  } // => end of if (typeof login !== "string" || login.trim() === ""
  if (typeof age !== "number" || !Number.isFinite(age)) {
    // => age policy in one test
    throw new Error("age must be a finite number"); // => names the violated rule
  } // => end of if (typeof age !== "number" || !Number.isFinite(age)
  return { login: login.trim(), age }; // => parsed value: trusted downstream
} // => end of function parseUser(raw: unknown): User
console.log(JSON.stringify(parseUser({ login: "  ada  ", age: 36 }))); // => Output: {"login":"ada","age":36}
try {
  // => the invalid payload below
  parseUser({ login: "", age: 36 }); // => blank login must fail parsing
} catch (err) {
  // => report the boundary rejection
  console.log("rejected:", err instanceof Error ? err.message : err); // => Output: rejected, rule named
} // => end of catch (err)
