// Example 61: StreamController Bridges Callbacks into Streams.
//
// Callback APIs push values on their own schedule; a StreamController
// catches each push with add and exposes the orderly stream behind it.
// Closing the controller ends the stream when the last callback fires,
// bridging the push world into the pull world the rest of the course
// already knows. At the interop boundary the same bridge carries native
// callbacks (dart:ffi) and script events (dart:js_interop) into streams;
// those runtimes are surveyed here, not run, and the pattern is the takeaway.
import 'dart:async'; // => StreamController, the callback-to-stream bridge

void main() async {
  // => the controller: callbacks push in, the stream flows out, in order
  final controller = StreamController<String>(); // => single-subscriber bridge
  // => subscribe FIRST: the pull waits before any push arrives below
  final pulled = controller.stream.toList(); // => terminal pull, staged early
  // => three legacy callbacks fire: the push world, unordered by nature
  final callbacks = ['oat weighed', 'tea weighed', 'rice weighed'];
  // => each callback adds to the controller: pushes become stream values
  for (final call in callbacks) {
    // => for-in: the push world enumerated
    // => add catches the push: the bridge takes custody of the value
    controller.add(call); // => order kept: adds sequence the pushes
  }
  // => close queues done after the buffered values: the pull drains them
  controller.close(); // => un-awaited: the toList below owns completion
  // => the bridged stream delivers: three values, pushed then pulled
  final delivered = await pulled; // => values first, done last, in order
  // => arrival order matches push order: the bridge preserves sequence
  print(
      'bridged: ${delivered.join(' | ')}'); // => Output: bridged: oat weighed | tea weighed | rice weighed
}
