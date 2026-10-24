// Example 35: The First Test Fails, Then Passes.
//
// Failing-test-first means the test exists before the fix: written
// against a stub it fails, proving it can catch the bug, and after the
// fix it passes, proving the fix works. This example tests doubling sack
// counts; the stub returned zero, the fix below doubles for real.
// Production Dart uses package:test with dart test; the shape here
// mirrors it (test sentences, expect checks) so the jump is vocabulary.

// => one counter for the whole file: every passing test ticks it once
var _passed = 0;

// test runs one named case: the body first, the tick and print after.
// => name reads as a sentence: the test list is the behavior list
// => assert failures stop the run: a red test is loud, never silent
void test(String name, void Function() body) {
  // => the behavior under test runs inside the body closure
  body(); // => throws on failure: the tick below never runs for red
  // => tick, then print: green tests count themselves out loud
  _passed++; // => one more behavior proven, counted where it passed
  print('  ok: $name'); // => indented ok: the green line per behavior
}

// expect checks one equality: actual against want, with the test's name.
// => assert carries the message: failures name the mismatch precisely
void expect(Object? actual, Object? want) {
  // => the single check: equal passes silent, unequal throws loud
  assert(actual == want, 'want $want, got $actual'); // => the whole matcher
}

void main() {
  // => the behavior list: one sentence per proven fact about doubling
  test('doubles a positive count', () {
    // => the first behavior: basics
    // => expect checks the fix: 6 in, 12 out, stub's zero long gone
    expect(doubleSacks(6), 12); // => green: the fix survived its own test
  });
  // => the edge behavior: doubling zero stays zero, not an error
  test('doubles zero to zero', () {
    // => the boundary the stub also missed
    // => zero in, zero out: the fix handles the floor honestly
    expect(doubleSacks(0), 0); // => green: boundaries belong in tests
  });
  // => the count line: two behaviors proven, printed for the transcript
  print('passed: $_passed'); // => Output: passed: 2
}

// doubleSacks doubles a sack count: the fix the failing test demanded.
// => the stub returned 0 for everything: the first run proved the test red
// => the fix multiplies: one operator, both behaviors satisfied at once
int doubleSacks(int sacks) => sacks * 2;
