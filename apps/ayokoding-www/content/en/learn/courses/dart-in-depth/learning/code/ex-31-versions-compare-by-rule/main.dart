// Example 31: Version Strings Compare by Rule, Not by Text.
//
// Caret ranges and version picks follow semantic-version rules: compare
// numbers left to right, never as text, where '10' would wrongly lose to
// '9'. This example parses version triples and picks the newest stable
// release the SDK range allows, exactly the choice pub performs.
void main() {
  // => candidate releases for the args package, oldest to newest listed
  const candidates = [
    '2.3.0',
    '2.4.0',
    '2.10.0',
    '3.0.0'
  ]; // => text order lies
  // => text order claims 2.4.0 beats 2.10.0: numbers must compare, not text
  final parsed = candidates.map(_parse).toList(); // => triples of ints
  // => filter to the caret range of ^2.4.0: at least 2.4.0, below 3.0.0
  final allowed = parsed.where((v) => _allows(v, [2, 4, 0])).toList();
  // => newest first by rule: 2.10.0 outranks 2.4.0 numerically
  allowed.sort(_compare); // => numeric triple order, major first
  // => the pick: newest allowed, rendered back to text for the lock line
  final pick = allowed.last; // => [2, 10, 0]: text sorting would miss it
  // => the resolved pin: the exact version a lockfile would record
  print('pick: ${pick.join('.')}'); // => Output: pick: 2.10.0
  // => rejected count: 2.3.0 too old, 3.0.0 past the caret ceiling
  print(
      'rejected: ${parsed.length - allowed.length}'); // => Output: rejected: 2
}

// _parse splits 'major.minor.patch' into three integers for comparison.
// => ints compare as numbers: 10 beats 9, unlike their texts
// => fixed triple: semantic versions always carry three positions
List<int> _parse(String v) => v.split('.').map(int.parse).toList();

// _allows tests a version against a caret floor below the next major.
// => floor 2.4.0 with ceiling 3.0.0: the ^2.4.0 rule in one predicate
// => same major required: caret never crosses a major boundary upward
bool _allows(List<int> v, List<int> floor) {
  // => different major: only the floor's own major line is allowed
  if (v[0] != floor[0]) return false; // => 3.0.0 refused: past the ceiling
  // => same major: minor-then-patch decide against the floor triple
  return _compare(v, floor) >= 0; // => 2.3.0 refused: below the floor
}

// _compare orders two triples major first, then minor, then patch.
// => negative, zero, positive: the sort contract in one function
// => position by position: the first differing slot decides everything
int _compare(List<int> a, List<int> b) {
  // => walk the three slots: major, minor, patch in order
  for (var i = 0; i < 3; i++) {
    // => fixed three: semantic versions comply
    // => first difference decides: later slots never overrule it
    if (a[i] != b[i]) return a[i].compareTo(b[i]); // => numeric, not textual
  }
  // => all slots equal: the versions are the same release
  return 0; // => zero means tie: sort keeps their relative order
}
