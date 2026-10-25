// Example 43: Name Every Test as One Small Sentence.
//
// One assertion per test keeps failures precise: the test name is the
// diagnosis, and nothing else in the test can be blamed. Small tests
// read as a checklist of the behavior, and a red line names the broken
// promise without opening the test body at all.
// Production Dart uses package:test with dart test; the shape here
// mirrors it (sentence names, single expects) so the jump is in
// vocabulary, not in concept.

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

// grade bands a score: the four promises below pin every boundary.
// => ordered guards: the first true band wins, top band checked first
String grade(int score) {
  // => ninety and above: the top band, checked before all others
  if (score >= 90) return 'A'; // => excellence: the ceiling promise
  // => seventy-five and above: the good band below excellence
  if (score >= 75) return 'B'; // => solid: the middle promise
  // => sixty and above: the passing floor, the weakest promise kept
  if (score >= 60) return 'C'; // => passing: the floor promise
  // => below sixty: the failing band, unnamed scores land here
  return 'F'; // => failing: the honesty promise for low scores
}

void main() {
  // => four tests, four promises: one assertion each, names as diagnoses
  test('95 earns A', () => expect(grade(95), 'A')); // => ceiling promise
  // => boundary promise: 90 itself already earns the top band
  test('90 earns A', () => expect(grade(90), 'A')); // => edge of excellence
  // => middle promise: 75 holds B without touching A or C
  test('75 earns B', () => expect(grade(75), 'B')); // => the solid middle
  // => floor promise: 59 fails, proving the C floor starts at sixty
  test('59 earns F', () => expect(grade(59), 'F')); // => honesty at the floor
  // => the count line: four sentences proven, each blaming only itself
  print('passed: $_passed'); // => Output: passed: 4
}
