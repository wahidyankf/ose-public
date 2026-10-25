// Example 3: While and Do-While Wait for a Condition.
//
// While checks before each pass and do-while checks after the first one,
// so do-while always runs its body at least once. Break and continue keep
// both shapes honest when the exit lives inside the body.
void main() {
  // => while first: the condition guards entry, so zero passes are possible
  var remaining = 3; // => counts down how many servings are still owed
  // => the header holds only the stay-in condition: the body owns progress
  while (remaining > 0) {
    // => repeat while servings are still owed
    remaining--; // => progress lives in the body, easy to forget elsewhere
  }
  // => loop ended exactly when the condition turned false
  print('while drained: $remaining'); // => Output: while drained: 0
  // => do-while second: the body runs once before the first check
  var attempts = 0; // => counts tries at an unreliable first step
  // => body first, question after: at least one attempt always happens
  do {
    attempts++; // => the attempt itself, unconditional on the first pass
    // => break on a plain condition: the only exit this loop trusts
    if (attempts == 2) {
      // => stop after two passes, no more
      break; // => leaves the innermost loop immediately
    }
    // => continue skips the rest of this pass: nothing follows it here
    continue; // => explicit about flowing into the next check
  } while (attempts < 10); // => the backstop: never more than ten tries
  // => break fired on the second pass, long before the backstop
  print('do-while attempts: $attempts'); // => Output: do-while attempts: 2
}
