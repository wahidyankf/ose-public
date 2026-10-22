// Solution: the billing rule pinned by a table test, failing-first.
// => one test, four rows: empty, single, multi, and the free-rate edge
// => the table is the specification: new edges cost one row, never rewrites
// => tiny harness: test ticks on green, expect throws loud on red
var _passed = 0; // => the counter: every green test ticks it once

// test runs one named case: body first, tick and print after.
void test(String name, void Function() body) {
  // => the behavior runs inside: throws on failure, ticks on green
  body(); // => red never ticks: the count line below stays honest
  // => tick, then print: green tests count themselves out loud
  _passed++; // => one more billing fact proven where it passed
  print('  ok: $name'); // => indented ok: the green line per behavior
}

// expect checks one equality: actual against want, failures loud.
void expect(Object? actual, Object? want) {
  // => equal passes silent: unequal throws with both values named
  assert(actual == want, 'want $want, got $actual'); // => the whole matcher
}

// freightTotal bills wagons times rate: pure, proven, and pinned now.
int freightTotal(List<int> wagons, int rate) {
  // => fold sums the loads: the rule the table below pins row by row
  final sacks = wagons.fold(0, (sum, w) => sum + w); // => zero wagons: zero
  // => rate multiplies the sum: the pricing policy in one operator
  return sacks * rate; // => pinned: the table fails first on any drift
}

void main() {
  // => the bill table: loads, rate, want; edges included, folklore ended
  final rows = [
    // => one row per shape the billing rule must honor
    [<int>[], 3, 0], // => empty wagons bill zero: the floor edge
    [
      [10],
      3,
      30
    ], // => single wagon: the simple middle
    [
      [10, 20],
      3,
      90
    ], // => multi: the fold earns its keep here
    [
      [10, 20],
      0,
      0
    ], // => free hauling: the zero-rate policy edge
  ];
  // => one test, four rows: the loop proves every edge through one expect
  test('freight bills by table', () {
    // => each row calls the pure core: no fixtures, no state, no clock
    for (final row in rows) {
      // => row walks the table top to bottom
      // => positional reads: loads, rate, want, in row order, cast once
      expect(freightTotal(row[0] as List<int>, row[1] as int), row[2]);
    }
  });
  // => the count line: four bills proven with zero fixtures built
  print('passed: $_passed'); // => Output: passed: 1
}
