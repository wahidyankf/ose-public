// Example 40: Async Tests Await Their Futures.
//
// Async tests are async functions: await the Future inside, then expect
// the delivered value like any sync result. Sequential awaits keep the
// transcript ordered, and a try around await pins the failure path with
// the same shape sync tests use for throws.
// Production Dart uses package:test with dart test; the shape here
// mirrors it (async test bodies, expect checks) so the jump is in
// vocabulary, not in concept.

// => one counter for the whole file: every passing test ticks it once
var _passed = 0;

// test runs one named async case: awaits the body, then ticks and prints.
Future<void> test(String name, Future<void> Function() body) async {
  // => await the behavior: values arrive, failures throw right here
  await body(); // => the async body runs to completion before the tick
  // => tick, then print: green async tests count themselves out loud
  _passed++; // => one more async behavior proven, counted where it passed
  print('  ok: $name'); // => indented ok: the green line per behavior
}

// expect checks one equality: actual against want.
void expect(Object? actual, Object? want) {
  // => the single check: equal passes silent, unequal throws loud
  assert(actual == want, 'want $want, got $actual'); // => the whole matcher
}

// fetch returns the sack count after one event-loop turn, failing unknown.
// => Future.delayed with zero duration: async shape, deterministic order
// => no clocks, no network: the ledger below is fixed and instant
Future<int> fetch(String item) {
  // => the ledger both outcomes read: fixed, offline, instant
  const ledger = {'oat': 12, 'tea': 4}; // => const: the ledger never moves
  // => delayed zero: yields to the loop, then answers from the ledger
  return Future.delayed(Duration.zero, () {
    // => async shape, fixed order
    // => unknown items throw into the Future: awaited failures, testable
    if (!ledger.containsKey(item)) throw Exception('$item unstocked');
    // => known items deliver: the value travels the async road too
    return ledger[item]!; // => looked up twice, honestly: contains then read
  });
}

void main() async {
  // => main is async: sequential awaits keep the transcript ordered
  // => stocked item delivers twelve through the event loop, deterministically
  await test('oat delivers 12', () async {
    // => async body, awaited inside
    // => await unwraps: the twelve arrives exactly like a sync value
    expect(await fetch('oat'), 12); // => green: async delivery proven
  });
  // => failure path: the unknown item throws where it is awaited
  await test('salt failure is catchable', () async {
    // => second async case
    // => try around await: the sync shape for throws, applied async
    try {
      // => this await throws: the transcript never sees a value line
      await fetch('salt'); // => unstocked: the Future carries the failure
      // => reaching here means the failure never came: fail the test
      assert(false, 'salt should have thrown'); // => loud if await misbehaves
    } catch (e) {
      // => the awaited failure lands here, typed and named
      // => message check: the failure names the unstocked item precisely
      expect('$e', 'Exception: salt unstocked'); // => green: failure proven
    }
  });
  // => the count line: two async behaviors proven across loop turns
  print('passed: $_passed'); // => Output: passed: 2
}
