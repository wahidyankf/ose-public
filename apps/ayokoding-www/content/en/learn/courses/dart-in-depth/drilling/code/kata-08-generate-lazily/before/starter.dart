// Starter: eager route list. The bug: every stop builds before any reads.
// => full list first: thousand-stop routes pay a thousand before mile one
// => rewrite: sync* generator like Example 60, one stop per pull
void main() {
  // => the route builds whole: four stops allocated before the first read
  print(route()); // => [mill, depot, stall, home]: all eager, all at once
}

// route builds every stop eagerly: simple, and wasteful at scale.
// => BUG: eager list: readers pay for stops they may never visit
List<String> route() {
  // => the whole route allocates: four strings before any reader arrives
  final stops = <String>[]; // => empty, then filled wholesale below
  // => stop by stop, all eager: mill, depot, stall, home, every time
  stops.add('mill'); // => allocated whether visited or not
  // => second stop eager too: the pattern repeats per stop, always all
  stops.add('depot'); // => paid upfront: laziness would defer this
  // => third and fourth: the whole journey, built before mile one
  stops.add('stall'); // => stall waits in memory for its eventual turn
  // => home last: the full price paid before the first mile is walked
  stops.add('home'); // => four allocations, zero reads so far
  // => the whole list returns: every stop built, few perhaps visited
  return stops; // => eager answer: complete, and completely upfront
}
