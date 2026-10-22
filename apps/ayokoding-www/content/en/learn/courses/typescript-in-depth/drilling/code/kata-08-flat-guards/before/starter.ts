// => Kata 8 starter: nested guards push the happy path two levels deep.
export interface Profile {
  // => optional shape
  contact?: {
    // => optional nest
    email?: string; // => optional leaf
  }; // => end of contact?:
} // => end of export interface Profile
export function emailOf(p: Profile): string {
  // => BUG: pyramid of guards
  if (p.contact !== undefined) {
    // => level one
    if (p.contact.email !== undefined) {
      // => level two
      return p.contact.email; // => happy path buried
    } else {
      // => leaf missing
      return "no-email"; // => fallback one
    } // => end of else
  } else {
    // => nest missing
    return "no-email"; // => fallback two, same value
  } // => end of else
} // => end of export function emailOf(p: Profile): string
