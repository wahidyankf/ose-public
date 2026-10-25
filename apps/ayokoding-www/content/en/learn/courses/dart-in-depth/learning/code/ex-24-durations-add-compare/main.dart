// Example 24: Durations Add, Compare, and Budget Time.
//
// Duration names a span in hours, minutes, and seconds, and arithmetic
// over Durations keeps scheduling math in one honest type. CompareTo
// orders spans, multiplication scales them, and inMinutes reads them out
// whole, with no floating-point dust anywhere.
void main() {
  // => two work shifts as spans: morning four hours, evening six and half
  const morning = Duration(hours: 4); // => const: shift lengths are facts
  const evening = Duration(hours: 6, minutes: 30); // => mixed units, one type
  // => addition totals the day: spans add into wider spans
  final day = morning + evening; // => ten hours thirty, exact, no dust
  // => inMinutes reads the total whole: 630 minutes, eyeball-free
  print('day minutes: ${day.inMinutes}'); // => Output: day minutes: 630
  // => compareTo orders spans: negative means the morning is shorter
  final order = morning.compareTo(evening); // => -1: morning comes first
  // => sign only: callers test < 0, never the exact magnitude
  print('morning shorter: ${order < 0}'); // => Output: morning shorter: true
  // => multiplication scales a span: two identical mornings, one expression
  final twice = morning * 2; // => eight hours: the operator keeps the type
  // => equality is by span, not by construction: 8h equals 8h however made
  print(
      'twice equals 8h: ${twice == const Duration(hours: 8)}'); // => Output: twice equals 8h: true
  // => subtraction budgets: the day minus the morning leaves the evening
  final rest = day - morning; // => spans subtract back into spans
  // => inHalfHours? no such getter: divide minutes by thirty, explicitly
  print('rest halves: ${rest.inMinutes ~/ 30}'); // => Output: rest halves: 13
}
