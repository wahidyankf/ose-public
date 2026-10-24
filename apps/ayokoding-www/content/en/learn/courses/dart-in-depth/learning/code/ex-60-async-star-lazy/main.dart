// Example 60: Async-Star Generates Lazily.
//
// Async* functions yield values one at a time as the listener pulls, so
// long sequences cost one value of memory no matter their length. Each
// yield pauses the generator until the next request arrives, which makes
// async* the shape for paged reads, sensor flows, and any sequence too
// long to build eagerly.
void main() async {
  // => the route generator yields four stops: pulled, never pushed eager
  final route = stops(); // => no stop exists yet: generation waits for pull
  // => collect pulls the whole route: four yields, four arrivals, in order
  final visited = await route.toList(); // => terminal pull: runs the body
  // => the visited order: yields arrive exactly as the body ordered them
  print(
      'visited: ${visited.join('>')}'); // => Output: visited: mill>depot>stall>home
  // => firstWhere pulls only until satisfied: the generator stops early
  final depot = await stops().firstWhere((s) => s.startsWith('d'));
  // => depot arrives after two yields: mill, then depot, then the pull ends
  print('found: $depot'); // => Output: found: depot
}

// stops yields the delivery route one stop at a time, lazily.
// => async*: yields pause the body until the listener asks for more
// => the body runs on pull: no listener, no stops, no cost anywhere
Stream<String> stops() async* {
  // => first yield: pauses here until the listener requests stop two
  yield 'mill'; // => the route start: pulled first, always
  // => second yield: resumes on request, pauses again right after
  yield 'depot'; // => Pulled second: firstWhere stops the pull here
  // => third yield: reached only by listeners that kept pulling past depot
  yield 'stall'; // => toList pulls through: this yield runs for visited
  // => final yield: the route end, pulled last by the complete collection
  yield 'home'; // => home: the fourth arrival closing the route
}
