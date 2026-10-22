// Example 16: Asserts Guard Invariants in Development.
//
// Assert states what must already be true: a passing assert is silent and
// free in production, while a failing one throws during development where
// the mistake is cheapest to fix. Guards at function entries turn caller
// bugs into immediate, local failures instead of distant wrong answers.
void main() {
  // => two honest calls: asserts pass silently, answers print
  print(sacksFor(10, 3)); // => Output: 4 trips
  // => exact division: no remainder, one clean sentence
  print(sacksFor(9, 3)); // => Output: 3 trips
}

// sacksFor counts cart trips for sacks at a per-trip capacity.
// => asserts guard the contract: positive sacks, positive capacity
// => callers that break the contract fail here, not three calls later
int sacksFor(int sacks, int perTrip) {
  // => first invariant: negative sacks are a caller bug, never freight
  assert(sacks >= 0, 'sacks cannot be negative'); // => silent when true
  // => second invariant: zero capacity would divide by zero below
  assert(perTrip > 0, 'capacity must be positive'); // => the crash prevented
  // => integer division rounds down: the remainder needs its own trip
  final full = sacks ~/ perTrip; // => ~/ divides and floors in one step
  // => a remainder means one more trip: the partial load still travels
  final extra = sacks % perTrip == 0 ? 0 : 1; // => exact loads add nothing
  // => total trips: full loads plus the possible partial one
  return full + extra; // => 10 at 3 per trip: 3 full plus 1 partial
}
