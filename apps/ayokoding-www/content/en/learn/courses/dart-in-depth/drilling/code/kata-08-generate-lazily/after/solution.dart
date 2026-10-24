// Solution: sync* yields one stop per pull, lazily and cheaply.
// => no list builds: stops exist only as the reader requests them
// => firstWhere pulls two: mill, depot, then the generator rests, done
void main() {
  // => the route generates: nothing exists until the pull below asks
  final stops = route(); // => no stop built yet: generation waits for pull
  // => toList pulls all four: mill, depot, stall, home, in order, on demand
  print(stops.toList()); // => Output: [mill, depot, stall, home]
  // => firstWhere pulls two: mill, then depot satisfies, generator rests
  print(route().firstWhere((s) => s.startsWith('d'))); // => Output: depot
}

// route yields the delivery stops one at a time: lazy by construction.
// => sync*: yield pauses until the next pull, resuming exactly there
// => the body runs on pull: no reader, no stops, no cost anywhere
Iterable<String> route() sync* {
  // => first yield: pauses here until the reader requests stop two
  yield 'mill'; // => the route start: pulled first, always
  // => second yield: resumes on request, pauses again right after
  yield 'depot'; // => pulled second: firstWhere rests the generator here
  // => third yield: reached only by readers pulling past depot
  yield 'stall'; // => toList pulls through: this yield runs for the list
  // => final yield: the route end, pulled last by complete collection
  yield 'home'; // => home: the fourth arrival closing the route
}
