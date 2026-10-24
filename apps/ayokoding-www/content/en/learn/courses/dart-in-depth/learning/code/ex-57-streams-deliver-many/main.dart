// Example 57: Streams Deliver Many Values Over Time.
//
// A Stream is a Future repeated: many values arrive in order through one
// subscription, and listen stages onData per value with onDone at the
// end. FromIterable builds a deterministic stream from a fixed list, so
// the survey studies the shape without waiting on clocks or sockets.
void main() async {
  // => the delivery route as a stream: four stops, fixed order, instant
  final route = Stream.fromIterable(['oat', 'tea', 'rice', 'salt']);
  // => delivered collects the stops the listener actually sees, in order
  final delivered = <String>[]; // => grows per onData: the arrival record
  // => listen stages the handlers: onData per stop, onDone at the end
  await route.listen((stop) {
    // => onData: runs once per arriving value
    // => each stop joins the record: arrival order preserved exactly
    delivered.add(stop); // => oat, then tea, rice, salt, in turn
  }).asFuture(); // => asFuture waits the onDone: the listen completes whole
  // => the arrival record: four stops in route order, none lost, none moved
  print('route: ${delivered.join('>')}'); // => Output: route: oat>tea>rice>salt
  // => length proves completeness: the stream ended exactly where listed
  print('stops: ${delivered.length}'); // => Output: stops: 4
}
