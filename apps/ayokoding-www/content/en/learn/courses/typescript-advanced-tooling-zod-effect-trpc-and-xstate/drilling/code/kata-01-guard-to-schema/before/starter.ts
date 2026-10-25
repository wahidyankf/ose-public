// => Kata 1 starter: a hand-rolled guard that forgets the age check.
// => Task: replace the manual checks with one schema gate that rejects bad ages.
function isSignup(input: unknown): boolean {
  // => the hand-rolled guard: checks email, forgets age entirely
  if (typeof input !== "object" || input === null) {
    // => non-objects are not signups
    return false; // => rejected
  } // => object confirmed
  const record = input as Record<string, unknown>; // => narrow once for key reads
  if (typeof record["email"] !== "string") {
    // => the only check this guard performs
    return false; // => rejected
  } // => email fine: the guard stops here, age unchecked
  return true; // => BUG: any age passes, including -3 and "old"
}
function main(): void {
  // => entry point; the bad payload slips through the hand-rolled guard
  // => a negative age passes: the guard never looked
  console.log("guard says: " + String(isSignup({ email: "ada@example.com", age: -3 }))); // => starter prints true: the bug
  // => the task: one schema gate so this prints false
  console.log("wanted: false"); // => target output after the fix
}
main(); // => run once; a throw exits nonzero
