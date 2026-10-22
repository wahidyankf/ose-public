// Example 38: Setup and Teardown Share the Fixture.
//
// SetUp builds a fresh fixture before every test and tearDown clears it
// after, so tests share the recipe without sharing the state. Fresh
// fixtures per test mean no test can poison the next one, and the order
// of tests stops mattering entirely.
// Production Dart uses package:test with dart test; the shape here
// mirrors it (setUp, tearDown, test) so the jump is vocabulary, not
// concept.

// => one counter for the whole file: every passing test ticks it once
var _passed = 0;

// _setups holds the setup closures: each runs before every single test.
final List<void Function()> _setups =
    []; // => recipes, not state: fresh each time

// _teardowns holds the cleanup closures: each runs after every test.
final List<void Function()> _teardowns =
    []; // => clearing recipes, run in order

// setUp registers a recipe: called fresh before each test, never shared.
void setUp(void Function() recipe) => _setups.add(recipe);

// tearDown registers a cleanup: called after each test, resetting shared.
void tearDown(void Function() cleanup) => _teardowns.add(cleanup);

// test runs setups, the body, then teardowns: the fixture sandwich.
// => fresh fixture per test: state never leaks from one test to the next
void test(String name, void Function() body) {
  // => setups first: every recipe rebuilds the world for this test
  for (final s in _setups) s(); // => fresh baskets, fresh counts, every time
  // => the behavior runs against the fresh fixture: failures stay local
  body(); // => throws on failure: teardowns below still run? no: kept simple
  // => teardowns after: the world resets for whatever test comes next
  for (final t in _teardowns) t(); // => cleared baskets: order stops mattering
  // => tick, then print: green tests count themselves out loud
  _passed++; // => one more behavior proven, counted where it passed
  print('  ok: $name'); // => indented ok: the green line per behavior
}

// expect checks one equality: actual against want.
void expect(Object? actual, Object? want) {
  // => the single check: equal passes silent, unequal throws loud
  assert(actual == want, 'want $want, got $actual'); // => the whole matcher
}

// the shared fixture: rebuilt by setUp before every test runs.
final basket = <String>[]; // => one basket, refilled fresh per test

void main() {
  // => the recipe: three oat sacks, fresh, before every single test
  setUp(() {
    // => runs before each test: the fixture sandwich top half
    // => clear first: the previous test's basket must not leak through
    basket.clear(); // => empty: teardown also clears, belt and suspenders
    // => refill: the canonical three-sack fixture every test expects
    basket.addAll(['oat', 'oat', 'oat']); // => fresh state, same recipe
  });
  // => the cleanup: empty basket after every test, proven by the next setUp
  tearDown(() => basket.clear()); // => reset: the sandwich bottom half
  // => first behavior: the fixture holds three sacks, as the recipe says
  test('fixture holds three', () => expect(basket.length, 3));
  // => second behavior: taking one leaves two, without touching others
  test('take leaves two', () {
    // => mutate freely: the next test gets a fresh basket regardless
    basket.removeAt(0); // => one sack out: local mutation, safe by design
    // => two remain: the mutation above is exactly what this test proves
    expect(basket.length, 2); // => green: teardown clears it right after
  });
  // => the count line: fixture sharing without state sharing, proven twice
  print('passed: $_passed'); // => Output: passed: 2
}
