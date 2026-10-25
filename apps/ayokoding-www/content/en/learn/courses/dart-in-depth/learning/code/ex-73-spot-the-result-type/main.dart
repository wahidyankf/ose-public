// Example 73: Spot the Result Type at Every Turn.
//
// Result-typed code announces its failure handling in the signatures:
// every function returns Success or Failure, and the chain switches on
// each step before proceeding. Spotting the Result at every turn tells
// the reader where failures can appear without reading a single body,
// and the bodies below only confirm what the signatures already said.
void main() {
  // => the chain: weigh, then price, then receipt, each Result-typed
  final weighed = weigh('oat', 12); // => Success(12): the honest weighing
  // => switch before proceeding: failures stop the chain at their step
  final priced = switch (weighed) {
    // => exhaustive: both arms, no default
    // => success continues: the value flows into the pricing step
    Success(value: final sacks) => price(sacks, 3),
    // => failure propagates: the reason passes through untouched
    Failure(reason: final reason) => Failure<int>(reason),
  };
  // => render whatever the chain settled on: receipt or reason, both data
  print(describe(priced)); // => Output: receipt: 36
  // => the miss chain: unknown crop fails at the first step, honestly
  final missed = weigh('salt', 5); // => Failure: never planted, never weighed
  // => describe renders the failure: the reason decided at the miss site
  print(describe(missed)); // => Output: miss: salt never planted
}

// Result carries success with a value or failure with a reason, sealed.
// => two arms, exhaustive switches: the failure-aware shape of example 14
sealed class Result<T> {
  // => const base: results build as cheaply as the values they carry
  const Result();
}

// Success wraps the value the step produced, typed and ready to flow.
final class Success<T> extends Result<T> {
  // => the value: present exactly when the step succeeded
  final T value; // => final: results never change after they settle
  // => const constructor: successes build at compile time
  const Success(this.value);
}

// Failure wraps the reason the step stopped, written where it is known.
final class Failure<T> extends Result<T> {
  // => the reason: decided at the failure site, rendered at the end
  final String reason; // => final: reasons never change after they settle
  // => const constructor: failures build as cheaply as successes
  const Failure(this.reason);
}

// weigh weighs a known crop or misses with the reason: the first step.
Result<int> weigh(String crop, int sacks) {
  // => the stocked crops: everything else misses at this step
  const stocked = ['oat', 'tea', 'rice']; // => const: the planting record
  // => unknown crops fail here: the reason names the unplanted crop
  if (!stocked.contains(crop)) return Failure('$crop never planted');
  // => known crops succeed: the weighed count flows to pricing
  return Success(sacks); // => Success<int>: the chain continues below
}

// price multiplies sacks by rate: the second step, failure-transparent.
Result<int> price(int sacks, int rate) => Success(sacks * rate); // => 36

// describe renders the chain's settlement: receipt for success, miss else.
String describe(Result<int> result) {
  // => exhaustive switch: the sealed base forces both arms, no default
  return switch (result) {
    // => signatures promised this shape throughout
    // => success renders the receipt: the value the chain computed
    Success(value: final sacks) => 'receipt: $sacks',
    // => failure renders the miss: the reason the first failure wrote
    Failure(reason: final reason) => 'miss: $reason',
  };
}
