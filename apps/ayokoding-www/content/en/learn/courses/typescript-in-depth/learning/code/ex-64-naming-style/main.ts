// => Example 64: names carry the style guide: verbs for functions, nouns for values.
function toSlug(raw: string): string {
  // => WHY verb: functions do something
  return raw.trim().toLowerCase().replace(/\s+/g, "-"); // => one transformation, verb name
} // => end of function toSlug(raw: string): string
const MAX_RETRIES = 3; // => WHY shout: module constant, never reassigned
interface RetryPolicy {
  // => WHY noun: interfaces name things
  attempts: number; // => plain field, no prefix
} // => end of interface RetryPolicy
const policy: RetryPolicy = { attempts: MAX_RETRIES }; // => policy assembled from the constant
console.log(toSlug("  Grace Hopper  ")); // => Output: grace-hopper
console.log(policy.attempts); // => Output: 3
const isReady = policy.attempts > 0; // => WHY is-prefix: booleans read as questions
console.log(isReady); // => Output: true
