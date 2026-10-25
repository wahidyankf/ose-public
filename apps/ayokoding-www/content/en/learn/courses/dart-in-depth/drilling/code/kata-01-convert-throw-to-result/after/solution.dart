// Solution: validation by Result return. Throw is gone from the path.
// => Result<int> out: Success carries counts, Failure carries reasons
// => negatives return data: callers switch, exactly like Example 14
void main() {
  // => valid input succeeds: the value flows through the Success arm
  print(describe(check(12))); // => Output: 12 sacks, checked
  // => negative input fails as data: the Failure arm renders the reason
  print(describe(check(-4))); // => Output: refused: negative sacks
}

// Result carries success with a value or failure with a reason, sealed.
sealed class Result<T> {
  // => const base: results build as cheaply as the values they carry
  const Result();
}

// Success wraps the checked count: the valid path, typed and flowing.
final class Success<T> extends Result<T> {
  // => the value: present exactly when validation passed
  final T value; // => final: results never change after they settle
  // => const constructor: successes build at compile time
  const Success(this.value);
}

// Failure wraps the refusal reason: decided here, rendered by callers.
final class Failure<T> extends Result<T> {
  // => the reason: written where the failure is known, read where shown
  final String reason; // => final: reasons never change after they settle
  // => const constructor: failures build as cheaply as successes
  const Failure(this.reason);
}

// check validates without throwing: negatives return, never crash.
// => negatives are data: Failure carries the refusal with its evidence
Result<int> check(int sacks) {
  // => negative input fails as data: the refusal travels as a value
  if (sacks < 0)
    return const Failure('negative sacks'); // => checked, not caught
  // => valid input succeeds: the count flows through the Success arm
  return Success(sacks); // => Success<int>: the caller switches on this
}

// describe renders either arm: receipt for success, refusal for failure.
String describe(Result<int> result) {
  // => exhaustive switch: the sealed base forces both arms, no default
  return switch (result) {
    // => the compiler checks no arm is missing
    // => Success arm: the value binds into the checked sentence
    Success(value: final sacks) => '$sacks sacks, checked',
    // => Failure arm: the reason renders beside the refusal word
    Failure(reason: final reason) => 'refused: $reason',
  };
}
