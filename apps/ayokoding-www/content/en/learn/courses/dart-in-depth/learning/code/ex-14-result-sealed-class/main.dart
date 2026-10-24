// Example 14: A Sealed Result Returns Failure as Data.
//
// Expected failures are data, not exceptions: a sealed Result is either
// Success with a value or Failure with a reason, and the switch over it
// must handle both arms. Callers check the shape instead of catching.
void main() {
  // => two lookups: one stocked, one never planted
  print(describe('oat', lookup('oat'))); // => Output: oat: 12 sacks
  // => the miss is a value: describe switches on the shape, no try needed
  print(describe(
      'salt', lookup('salt'))); // => Output: salt: out of stock (never planted)
}

// Result is either success with a value or failure with a reason.
// => sealed: the compiler knows every subtype, so switches stay exhaustive
// => two arms, no more: success and failure cover the whole outcome space
sealed class Result<T> {
  // => const base: subtypes build their values at compile time
  const Result();
}

// Success carries the looked-up value with its type intact.
// => generic over T: the value keeps whatever type the lookup found
final class Success<T> extends Result<T> {
  // => the value: present exactly when the outcome is success
  final T value; // => final: a result never changes after it is built
  // => const constructor: results are cheap values, not events
  const Success(this.value);
}

// Failure carries the human reason the lookup came up empty.
// => the reason is a sentence for display, decided at the failure site
final class Failure<T> extends Result<T> {
  // => the reason: written where the failure is known, read where shown
  final String reason; // => final: the reason is fixed at construction
  // => const constructor: failures build as easily as successes
  const Failure(this.reason);
}

// lookup finds the stock or reports the miss as a Failure value.
// => no throw anywhere: the miss is an ordinary return, checkable locally
Result<int> lookup(String item) {
  // => the ledger: two stocked items, salt never planted
  const stock = {'oat': 12, 'tea': 4}; // => const map: the ledger is fixed
  // => the value may be absent: the shape of the answer depends on it
  final sacks = stock[item]; // => int? : null when the item is missing
  // => null means miss: wrap the reason, not an exception
  if (sacks == null) {
    // => the miss condition, decided by the lookup
    return const Failure('out of stock (never planted)'); // => data, not throw
  }
  // => present means success: wrap the value with its type kept
  return Success(sacks); // => Success<int>: the caller switches on this
}

// describe renders either arm of a lookup result for the named item.
// => the item travels beside the result: Success forgot the name by design
// => exhaustive switch: the sealed base forces both arms to exist
String describe(String item, Result<int> result) {
  // => switch over the sealed type: Success arm and Failure arm, nothing else
  return switch (result) {
    // => the compiler checks no arm is missing
    // => Success arm: the value binds and formats with the item name
    Success(value: final sacks) => '$item: $sacks sacks',
    // => arms split with commas: a switch expression yields one value
    // => Failure arm: the reason was written at the miss site, shown here
    Failure(reason: final reason) => '$item: $reason',
  };
}
