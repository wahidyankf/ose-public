// Example 56: Future.wait Joins Independent Branches.
//
// Independent futures run together and Future.wait gathers their values
// in order, so three stalls report as one list when the slowest lands.
// EagerError false collects every branch's outcome; the default true
// fails fast on the first error, and this example shows the gathering
// shape with three healthy branches.
void main() async {
  // => three independent counts: no branch awaits another before starting
  final oat = Future.value(12); // => east stall: instant, ordered
  final tea = Future.value(4); // => west stall: instant, ordered
  final rice = Future.value(20); // => north stall: instant, ordered
  // => wait gathers in list order: oat, tea, rice, whatever lands first
  final counts = await Future.wait([oat, tea, rice]); // => [12, 4, 20]
  // => the gathered list: positions match the input order, always
  print('counts: $counts'); // => Output: counts: [12, 4, 20]
  // => totals fold the gathered branch values: one pass over the joined
  final total = counts.fold(0, (sum, c) => sum + c); // => 36 across stalls
  // => the day total: joined first, summed second, in that fixed order
  print('total: $total'); // => Output: total: 36
}
