// Example 4: Switch Picks Without Falling Through.
//
// Dart cases never fall through into each other, so each branch stands
// alone with no break to remember. Guards with when add a second test to
// a case without nesting another if inside it.
void main() {
  // => one score drives both switches below
  const score = 85; // => const: a compile-time value the cases can trust
  // => switch on the value: each case owns its own branch, no fallthrough
  final grade = switch (score) {
    // => switch expression yields the grade
    // => guards refine a case: range test plus the when condition
    >= 90 => 'A', // => ninety and above: the top band
    // => first true arm wins: order narrowest band first
    >= 75 when score.isEven => 'B (even)', // => Output arm for 85? no: odd
    >= 75 => 'B', // => seventy-five and above: where 85 lands
    >= 60 => 'C', // => sixty and above: the passing floor
    _ => 'F', // => wildcard: the ruler every switch must carry
  };
  // => 85 is odd, so the guarded arm passes over and plain B wins
  print('grade: $grade'); // => Output: grade: B
  // => statement switch second: same no-fallthrough rule, effects in arms
  const day = 'Sat'; // => weekend day to classify by name
  // => cases match constants: strings work as well as numbers
  switch (day) {
    // => statement form: arms act instead of yielding
    case 'Sat': // => Saturday matches the first arm directly
    case 'Sun': // => stacked cases share one body: the only sharing allowed
      // => two labels, one body: weekend handling stays in one place
      print('day: weekend'); // => Output: day: weekend
    default: // => default: the statement form of the wildcard
      // => unreachable here: Sat already matched above
      print('day: weekday'); // => kept so every input has an answer
  }
}
