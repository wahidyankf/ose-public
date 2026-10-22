// Example 7: Sets Keep the Uniques and Do the Algebra.
//
// A Set stores each value once, so adding a duplicate changes nothing.
// Union, intersection, and difference answer membership questions about
// two groups without a single handwritten loop.
void main() {
  // => two harvest crews: names may repeat across crews
  final morning = {'sari', 'budi', 'sari'}; // => literal drops the repeat
  // => the set holds each name once: duplicates never survive insertion
  print('morning: $morning'); // => Output: morning: {sari, budi}
  // => add of a duplicate: returns false and changes nothing
  final added = morning.add('sari'); // => already present: no change at all
  // => false means "was already there": the set reports its own restraint
  print('added again: $added'); // => Output: added again: false
  // => evening crew overlaps on budi and brings dewi
  final evening = {'budi', 'dewi'}; // => second group for the algebra below
  // => union: everyone who worked at least one shift, no repeats
  final everyone = morning.union(evening); // => {sari, budi, dewi}
  // => lookup answers membership: the question sets exist to answer
  print('dewi worked: ${everyone.contains('dewi')}'); // => Output: true
  // => intersection: only the names present in both shifts
  final both = morning.intersection(evening); // => {budi}: the overlap
  // => difference: morning names who skipped the evening shift
  final morningOnly = morning.difference(evening); // => {sari}: sari alone
  // => one line per algebra answer: overlap first, remainder second
  print(
      'both: $both, morning-only: $morningOnly'); // => Output: both: {budi}, morning-only: {sari}
}
