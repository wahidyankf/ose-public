// => Kata 8 solution: ?. plus ?? flatten the pyramid into one expression.
interface Profile {
  // => same optional shape
  contact?: {
    // => optional nest
    email?: string; // => optional leaf
  }; // => end of contact?:
} // => end of interface Profile
function emailOf(p: Profile): string {
  // => one expression
  return p.contact?.email ?? "no-email"; // => WHY ?. plus ??: missing at any depth falls back
} // => end of function emailOf(p: Profile): string
console.log(emailOf({})); // => Output: no-email
console.log(emailOf({ contact: {} })); // => Output: no-email
console.log(emailOf({ contact: { email: "a@example.com" } })); // => Output: a@example.com
