// Example 41: Pure Functions Are the Easiest to Test.
//
// Pure functions take values and return values: no clock, no files, no
// hidden state, so tables of input and want prove them completely. This
// example extracts the pure freight total from itsIO shell, then pins it
// with a table covering empty, single, and multi-wagon loads.
// Production Dart uses package:test with dart test; the shape here
// mirrors it (test sentences, table loops) so the jump is vocabulary.

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

// freightTotal is pure: wagon loads in, freight bill out, nothing else.
// => no IO, no clock, no globals: the same input always bills the same
// => extracted from the shell that reads the scale: test the core, not IO
int freightTotal(List<int> wagons, int rate) {
  // => fold sums the loads: the whole bill in one lazy pass
  final sacks = wagons.fold(0, (sum, w) => sum + w); // => zero wagons: zero
  // => rate multiplies the sum: one operator, the entire pricing policy
  return sacks * rate; // => sacks times rate: the bill, nothing hidden
}

void main() {
  // => the bill table: loads, rate, and want per row, edges included
  final rows = [
    // => one row per shape: empty, single, multi, free rate
    ['empty wagons', <int>[], 3, 0], // => no freight: the bill is zero
    [
      'single wagon',
      [10],
      3,
      30
    ], // => one load: the simple middle
    [
      'three wagons',
      [10, 20, 30],
      2,
      120
    ], // => multi: the fold earns it
    [
      'free hauling',
      [10, 20],
      0,
      0
    ], // => zero rate: policy edge, bills zero
  ];
  // => one test, four rows: the pure core proves through a single expect
  test('freight bills by table', () {
    // => each row calls the pure core: no setup, no teardown, no state
    for (final row in rows) {
      // => row walks the table top to bottom
      // => positional reads: name, loads, rate, want, in row order
      expect(freightTotal(row[1] as List<int>, row[2] as int), row[3]);
    }
  });
  // => the count line: four bills proven with zero fixtures built
  print('passed: $_passed'); // => Output: passed: 1
}
