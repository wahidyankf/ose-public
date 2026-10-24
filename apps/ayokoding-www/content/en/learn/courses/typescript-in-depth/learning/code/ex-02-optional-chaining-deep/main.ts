// => Example 2: ?. plus ?? walks optional shapes with no guard pyramid.
interface Profile {
  // => a user record with optional contact details
  name: string; // => always present: the required core
  contact?: {
    // => optional nest: may be missing entirely
    email?: string; // => optional leaf: present only when known
  }; // => end of contact?:
} // => end of interface Profile
const ada: Profile = { name: "ada" }; // => no contact block at all
const grace: Profile = { name: "grace", contact: {} }; // => contact present, email missing
function emailOf(p: Profile): string {
  // => one expression, no nesting
  return p.contact?.email ?? "no-email"; // => WHY ?. plus ??: missing at any depth falls back
} // => end of function emailOf(p: Profile): string
console.log(emailOf(ada)); // => Output: no-email, contact itself missing
console.log(emailOf(grace)); // => Output: no-email, the leaf missing instead
console.log(emailOf({ name: "alan", contact: { email: "a@example.com" } })); // => Output: a@example.com
