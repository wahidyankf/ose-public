// Example 37: Matchers Read Like Sentences.
//
// Matchers turn checks into sentences: expect(count, equals(12)) reads as
// 'count equals twelve', and combined matchers read as compound claims.
// Small matcher functions compose with ordinary boolean operators, so the
// test file grows a vocabulary instead of repeating comparisons.
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

// expect checks actual against a matcher sentence with a what for errors.
// => matchers are functions: composable, nameable, reusable across tests
void expect(dynamic actual, bool Function(dynamic) matcher, String what) {
  // => the matcher decides: true passes silent, false throws with what
  assert(matcher(actual), 'FAIL $what: got $actual'); // => what names it
}

// equals matches exactly the wanted value: the sentence 'equals twelve'.
bool Function(dynamic) equals(dynamic want) => (a) => a == want;

// greaterThan matches above the floor: the sentence 'above ten sacks'.
bool Function(dynamic) greaterThan(num floor) => (a) => a is num && a > floor;

// contains matches a member: the sentence 'holds the oat tag'.
bool Function(dynamic) contains(dynamic item) =>
    (a) => a is Iterable && a.contains(item);

void main() {
  // => the harvest under test: twelve oat sacks tagged dry and graded
  const harvest = {
    'crop': 'oat',
    'sacks': 12,
    'tags': ['dry', 'graded']
  };
  // => equals sentence: the count is exactly twelve, no more, no less
  test('count equals 12', () => expect(harvest['sacks'], equals(12), 'sacks'));
  // => greaterThan sentence: twelve clears the ten-sack mill minimum
  test('count clears the minimum',
      () => expect(harvest['sacks'], greaterThan(10), 'minimum'));
  // => contains sentence: the tags hold the dry grade the buyer requires
  test('tags hold dry', () => expect(harvest['tags'], contains('dry'), 'tags'));
  // => combined sentence: two matchers, one claim, ordinary operators
  test('big dry harvest', () {
    // => both matchers must hold: a compound claim in one test sentence
    expect(harvest['sacks'], greaterThan(10), 'minimum');
    // => second half of the compound: tags still holding dry
    expect(harvest['tags'], contains('dry'), 'tags');
  });
  // => the count line: four matcher sentences proven, all green
  print('passed: $_passed'); // => Output: passed: 4
}
