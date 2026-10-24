// Example 42: A Fake Replaces the Ledger IO.
//
// Tests never touch the real ledger file: a fake implements the same
// reader interface from memory, so tests run offline, instant, and
// repeatable. The interface is the seam; production plugs the file
// reader in, tests plug the fake, and neither knows the other exists.
// Production Dart uses package:test with dart test; the shape here
// mirrors it (test sentences, expect checks) so the jump is vocabulary.

// => one counter for the whole file: every passing test ticks it once
var _passed = 0;

// test runs one named case: the body first, the tick and print after.
void test(String name, void Function() body) {
  // => the behavior under test runs inside the body closure
  body(); // => throws on failure: the tick below never runs for red
  // => tick, then print: green tests count themselves out loud
  _passed++; // => one more behavior proven, counted where it passed
  print('  ok: $name'); // => indented ok: the green line per behavior
}

// expect checks one equality: actual against want.
void expect(Object? actual, Object? want) {
  // => the single check: equal passes silent, unequal throws loud
  assert(actual == want, 'want $want, got $actual'); // => the whole matcher
}

// LedgerReader is the seam: one method, two plugs, file and memory.
// => the interface owns the reading shape: callers depend on it alone
// => production plugs a file reader; tests plug the fake below
abstract interface class LedgerReader {
  // => read returns the counted sacks for the named crop, or null missing
  int? read(String crop);
}

// FakeReader implements the seam from a fixed memory map: no files ever.
// => const map: the fake's answers are fixtures, visible and versioned
// => implements, never extends: the fake owes only the method, no internals
class FakeReader implements LedgerReader {
  // => the memory ledger: two stocked crops, salt forever missing
  final Map<String, int> data = const {'oat': 12, 'tea': 4};
  // => read looks up the map: same signature, none of the disk
  @override
  int? read(String crop) => data[crop]; // => null for salt: the miss path
}

// stockLine renders through any reader: the logic under test, IO-free.
// => depends on the seam: testable with the fake, shippable with files
String stockLine(LedgerReader reader, String crop) {
  // => the read happens once: null means the miss branch below
  final sacks = reader.read(crop); // => int? : the seam's honest answer
  // => null renders the miss: the same sentence the stall sign shows
  if (sacks == null) return '$crop: unstocked'; // => salt lands here
  // => present renders the count: the receipt line for stocked crops
  return '$crop: $sacks sacks'; // => oat lands here with its twelve
}

void main() {
  // => the fake plugs the seam: memory answers, zero disk touched
  final reader = FakeReader(); // => one fake serves every test below
  // => stocked path: the fake's twelve renders through the real logic
  test('oat renders twelve',
      () => expect(stockLine(reader, 'oat'), 'oat: 12 sacks'));
  // => miss path: the fake's null renders the unstocked sentence
  test('salt renders unstocked',
      () => expect(stockLine(reader, 'salt'), 'salt: unstocked'));
  // => the count line: both paths proven with no file ever opened
  print('passed: $_passed'); // => Output: passed: 2
}
