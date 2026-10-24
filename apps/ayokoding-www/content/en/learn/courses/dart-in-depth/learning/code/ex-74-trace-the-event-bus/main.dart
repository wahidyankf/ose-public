// Example 74: Trace the Event Bus End to End.
//
// An event bus decouples announcers from listeners: the controller takes
// events, the broadcast stream carries them, and each listener keeps its
// own tally. Tracing one event from announce through both tallies covers
// the file: the bus adds nothing but fan-out, and fan-out is the lesson.
// At the platform boundary the same bus carries native callbacks and
// script events into one Dart flow; those runtimes stay surveyed, while
// the fan-out pattern below runs on pure Dart events.
import 'dart:async'; // => StreamController: the fan-out engine of the bus

void main() async {
  // => the bus: one announcer in, two tallies out, fan-out between
  final bus = EventBus(); // => the controller and broadcast live inside
  // => counter tally: sums every sack count the bus announces
  var counted = 0; // => grows per event the first listener sees
  // => watcher tally: names every crop the bus announces, in order
  final watched = <String>[]; // => grows per event the second listener sees
  // => listener one counts: each event adds its sacks to the running sum
  final counting = bus.flow.listen((e) => counted += e.sacks);
  // => listener two watches: each event appends its crop name in order
  final watching = bus.flow.listen((e) => watched.add(e.crop));
  // => three announcements: the traced material crossing the bus
  bus.announce('oat', 12); // => first event: counted 12, watched oat
  // => second announcement: tallies grow to 16 and oat-tea in order
  bus.announce('tea', 4); // => counted 16, watched oat then tea
  // => third announcement: the last event before the bus closes
  bus.announce('rice', 20); // => counted 36, watched three crops
  // => close queues done after the three events: the listeners drain them
  bus.close(); // => un-awaited: the subscription futures own completion
  // => completions land: each listener saw all three events exactly once
  await counting.asFuture(); // => counter complete: 36 across three events
  // => watcher complete: three crops in announcement order, none lost
  await watching.asFuture(); // => order kept: fan-out preserves sequence
  // => the tallies print: sum beside names, the traced event thrice proven
  print(
      'counted: $counted, watched: ${watched.join(',')}'); // => Output: counted: 36, watched: oat,tea,rice
}

// HarvestEvent pairs a crop with its announced sacks: the bus envelope.
// => const: announcements build as cheap values at the announce site
class HarvestEvent {
  // => final facts: the crop and count of one announcement, frozen
  final String crop; // => which crop crossed the bus in this event
  final int sacks; // => how many sacks the event carried with it
  // => const constructor: events cost nothing to announce
  const HarvestEvent(this.crop, this.sacks);
}

// EventBus fans announcements out to every listener through one flow.
// => the controller takes pushes: announce adds, close ends, in order
// => the broadcast flow shares: every listener drinks the full stream
class EventBus {
  // => the engine: single controller, broadcast flow, many listeners
  final _controller = StreamController<HarvestEvent>.broadcast();
  // => flow exposes the stream: listeners subscribe here, never upstream
  Stream<HarvestEvent> get flow => _controller.stream; // => shared flow
  // => announce pushes one event: every listener receives it in order
  void announce(String crop, int sacks) => // => the fan-in: one call
      _controller.add(HarvestEvent(crop, sacks)); // => envelope, then push
  // => close ends announcements: listeners complete after the last event
  Future<void> close() => _controller.close(); // => fan-out ends here
}
