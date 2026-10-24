// Example 44: Inject the Clock, Never Read It.
//
// Logic that calls DateTime.now cannot be tested: every run reads a new
// answer. Injecting the instant as a parameter freezes time for tests
// while production passes the real now at the single call site. Frozen
// time makes the boundary testable to the exact day.
// Production Dart uses package:test with dart test; the shape here
// mirrors it (frozen inputs, expect checks) so the jump is vocabulary.

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

// season names the harvest season for the given instant: pure and frozen.
// => now is a parameter: tests freeze it, production passes DateTime.now
// => March through August is dry season: the mill's working half-year
String season(DateTime now) {
  // => month decides: 3..8 dry, the rest wet, no clock read inside
  if (now.month >= 3 && now.month <= 8) return 'dry'; // => working half-year
  // => outside the window: the wet months the mill plans around
  return 'wet'; // => the other half: maintenance and repair season
}

void main() {
  // => frozen March noon UTC: mid dry season, no clock involved at all
  test('march is dry', () => expect(season(DateTime.utc(2026, 3, 14)), 'dry'));
  // => frozen boundary: August 31 still dry, the last dry day of the year
  test('august is dry', () => expect(season(DateTime.utc(2026, 8, 31)), 'dry'));
  // => frozen September: one day past the window, already wet season
  test('september is wet',
      () => expect(season(DateTime.utc(2026, 9, 1)), 'wet'));
  // => the count line: three frozen instants, three exact answers, no clock
  print('passed: $_passed'); // => Output: passed: 3
}
