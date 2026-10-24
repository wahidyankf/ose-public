// Example 39: Edge Cases Belong in Tables.
//
// Tables turn edge cases from folklore into rows: input beside want, one
// row per boundary, looped through the same expect. Empty, single, and
// full baskets each get a row, and adding the next edge means adding one
// row, never rewriting the test.
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

// full reports whether the basket reached the ten-sack mill minimum.
// => boundary at ten: nine is short, ten is full, eleven is surplus
bool full(List<String> basket) => basket.length >= 10;

void main() {
  // => the edge table: name, basket size, and the want for each row
  final rows = [
    // => one row per boundary: empty, one short, full, surplus
    ['empty basket', 0, false], // => nothing: not full by any reading
    ['single sack', 1, false], // => one: the smallest non-empty edge
    ['nine sacks', 9, false], // => one short: the boundary's cruel neighbor
    ['ten sacks', 10, true], // => exactly full: the boundary itself
    ['eleven sacks', 11, true], // => surplus: past full stays full
  ];
  // => one test, five rows: the loop proves every edge through one expect
  test('mill-minimum edges', () {
    // => each row builds its basket and checks the want beside it
    for (final row in rows) {
      // => row walks the table top to bottom
      // => List.filled builds the sized basket: 'oat' repeated, honest size
      final basket = List.filled(row[1] as int, 'oat'); // => sized fixture
      // => the row's want decides: full exactly when the table says so
      expect(full(basket), row[2]); // => one expect, five boundaries proven
    }
  });
  // => the count line: one test, five edges, all green in a single pass
  print('passed: $_passed'); // => Output: passed: 1
}
