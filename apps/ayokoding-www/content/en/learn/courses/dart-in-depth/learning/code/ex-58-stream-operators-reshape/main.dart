// Example 58: Stream Operators Reshape the Flow.
//
// Where, map, take, and fold reshape a stream without touching its
// source: each operator returns a new stream, and the terminal fold
// pulls values through the whole chain exactly once. Pipelines compose
// from small named stages, and the source list never learns it was
// filtered, converted, and totaled on its way through.
void main() async {
  // => sack weights in kilograms: the raw readings the pipeline refines
  final weights = Stream.fromIterable([12, 7, 20, 5, 15]);
  // => where keeps the heavy sacks: lazy stage one, nothing pulled yet
  final heavy = weights.where((w) => w >= 10); // => 12, 20, 15 survive
  // => map converts survivors to grams: lazy stage two, still nothing
  final grams = heavy.map((w) => w * 1000); // => 12000, 20000, 15000
  // => take caps the flow: lazy stage three, at most the first two
  final capped = grams.take(2); // => 12000, 20000: the third never pulls
  // => fold terminals the chain: pulls twice, sums, completes the stream
  final total = await capped.fold(0, (sum, g) => sum + g); // => 32000
  // => one pull through three stages: filter, convert, cap, then total
  print('capped grams: $total'); // => Output: capped grams: 32000
}
