// Example 17: Async Failures Travel Through Futures.
//
// A Future carries either a value or a failure, so async code checks the
// failure with catchError or try-catch around await instead of a second
// error channel. The failure waits inside the Future until something
// asks for the value, then it throws at exactly that point.
void main() async {
  // => main is async: await works directly in the entry point
  // => the stocked item awaits into a value: the happy async path
  print(describe(await stock('oat'))); // => Output: oat holds 12 sacks
  // => the missing item awaits into a throw: caught where it is awaited
  try {
    // => await unwraps the Future: values arrive, failures throw here
    print(describe(await stock('salt'))); // => never prints: salt throws
  } catch (e) {
    // => the boundary around the await answers the failure
    // => the message names the item: the failure waited for this await
    print('missing: $e'); // => Output: missing: Exception: salt is unstocked
  }
}

// stock fetches an item count as a Future, failing for unstocked items.
// => Future<int> out: the value now, or the failure when awaited
// => async with no await inside still wraps the result as a Future
Future<int> stock(String item) async {
  // => the ledger both branches read: fixed, offline, instant
  const ledger = {'oat': 12, 'tea': 4}; // => const: the ledger never moves
  // => the count may be absent: the async shape of the missing answer
  final sacks = ledger[item]; // => int? : null when the item is missing
  // => null means the failure travels inside the Future, not out of it
  if (sacks == null) {
    // => salt lands here: absent from the ledger
    throw Exception('$item is unstocked'); // => throws into the Future
  }
  // => present means the value travels instead: awaited normally
  return sacks; // => async wraps the int into Future<int> automatically
}

// describe renders a fetched count once the Future delivers it.
// => takes the plain int: awaiting already happened at the call site
// => pure formatting: no async left inside, nothing left to fail
String describe(int sacks) {
  // => the value arrived safely: format it like any sync value
  return 'oat holds $sacks sacks'; // => the item name rides from the caller
}
