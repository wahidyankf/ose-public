// Example 36: Groups Name the Subject Under Test.
//
// Group collects the tests for one subject under one heading, so the
// transcript reads as a specification: fresh stock behaves so, stored
// stock behaves so. Two subjects, two groups, no test wondering where
// it belongs, and the count line proves every group ran to green.
// Production Dart uses package:test with dart test; the shape here
// mirrors it (group names, test sentences, expect checks) so the jump
// is vocabulary, not concept.

// => one counter for the whole file: every passing test ticks it once
var _passed = 0;

// group prints its subject heading, then runs the subject's tests.
// => the heading is the specification line the tests below prove
void group(String name, void Function() body) {
  // => subject first: readers meet the what before the individual hows
  print('## $name'); // => heading level two: the spec line in transcript
  // => the tests run inside: each ticks the shared counter on green
  body(); // => all group tests run before the next group starts
}

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

// fresh reports whether a harvest day count is still sellable as fresh.
// => over seven days old: the stall sells it as stored, never fresh
bool fresh(int daysOld) => daysOld <= 7;

void main() {
  // => first subject: fresh stock and its seven-day boundary
  group('fresh stock', () {
    // => the heading the next two tests prove
    // => six days still fresh: inside the boundary, sellable as fresh
    test('six days is fresh', () => expect(fresh(6), true));
    // => eight days stored: past the boundary, honesty renames it
    test('eight days is stored', () => expect(fresh(8), false));
  });
  // => second subject: the stored path and its discount rule
  group('stored discount', () {
    // => a second heading, a second subject
    // => stored sacks sell at half price: the policy this test pins
    test('stored halves the price', () => expect(price(10, false), 5));
    // => fresh sacks keep full price: the control the discount needs
    test('fresh keeps the price', () => expect(price(10, true), 10));
  });
  // => the count line: four behaviors across two subjects, all green
  print('passed: $_passed'); // => Output: passed: 4
}

// price halves for stored stock and holds for fresh: the stall policy.
// => isFresh decides the branch: one predicate, two price fates
int price(int tag, bool isFresh) => isFresh ? tag : tag ~/ 2;
