// Example 59: Broadcast Streams Share One Flow.
//
// A single-subscription stream allows one listener; asBroadcastStream
// opens the same flow to many, and each listener receives every value
// from the moment it subscribes. Two listeners over one harvest feed
// prove the sharing: the counter totals while the recorder logs, and
// neither starves the other of a single value.
void main() async {
  // => the harvest feed: one stream, three sack counts, fixed order
  final feed = Stream.fromIterable([10, 20, 30]).asBroadcastStream();
  // => the counter's total: grows per value the first listener sees
  var total = 0; // => starts at zero: no value has flowed yet
  // => the recorder's log: grows per value the second listener sees
  final log = <int>[]; // => empty: no value has been recorded yet
  // => first listener totals: every value adds to the running sum
  final counting = feed.listen((sacks) {
    // => listener one: the counter
    // => each arrival adds: the sum tracks the feed exactly
    total += sacks; // => 10, then 30, then 60 as values arrive
  });
  // => second listener records: every value lands in the log in order
  final recording = feed.listen(log.add); // => listener two: the recorder
  // => both subscriptions complete: the shared flow ends for everyone
  await counting.asFuture(); // => first listener saw all three values
  // => second completion: the recorder logged the same three values
  await recording.asFuture(); // => shared flow: neither starved the other
  // => the counter proves sharing: sixty across the three arrivals
  print('total: $total'); // => Output: total: 60
  // => the log proves order: same three values, same sequence, no loss
  print('log: $log'); // => Output: log: [10, 20, 30]
}
