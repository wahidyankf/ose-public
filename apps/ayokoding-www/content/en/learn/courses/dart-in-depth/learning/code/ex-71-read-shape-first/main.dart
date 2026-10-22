// Example 71: Read the Shape First, the Lines Second.
//
// Reading starts with the shape: signatures first, bodies later, names
// as the map. This word counter's shape says 'split, tally, report' in
// three signatures; the bodies below only fill the shape in. Read every
// unfamiliar sample this way: map the names, then spend lines where the
// map looks surprising, never top-to-bottom on the first pass.
void main() {
  // => the manifest line counts its own words through the shaped trio
  const line = 'oat oat tea oat rice tea oat'; // => seven words, three kinds
  // => words splits: the shape's first promise, kept below
  final words = splitWords(line); // => seven tokens, order kept
  // => tally counts: the shape's second promise, frequencies out
  final counts = tally(words); // => oat 4, tea 2, rice 1, as a map
  // => report renders: the shape's third promise, sorted by count
  print(report(counts)); // => Output: oat:4 tea:2 rice:1
}

// splitWords splits a line on spaces: the shape's first member.
// => signature promises tokens: the body keeps it in one expression
List<String> splitWords(String line) => line.split(' ');

// tally counts each distinct word: the shape's second member.
// => fold into frequencies: update with ifAbsent, the grouping idiom
Map<String, int> tally(List<String> words) {
  // => the frequencies start empty: every word below is a first sighting
  final counts = <String, int>{}; // => word to sightings, insertion-ordered
  // => each word ticks its own count: seed one, add one, in one call
  for (final word in words) {
    // => for-in: every token visits exactly once
    // => update seeds or adds: the grouping shape from example 32, reused
    counts.update(word, (n) => n + 1, ifAbsent: () => 1); // => oat reaches 4
  }
  // => the map returns whole: frequencies, keyed by word, ready to render
  return counts; // => shape kept: frequencies out, as promised
}

// report renders frequencies sorted by count, pairs joined by spaces.
// => entries sorted descending: the busiest word leads the line
String report(Map<String, int> counts) {
  // => entries copy to a list: sorting needs the list shape, not the map
  final entries = counts.entries.toList(); // => pairs, sortable at last
  // => sort by count descending: b before a when b outnumbers a
  entries.sort((a, b) => b.value.compareTo(a.value)); // => oat first at 4
  // => pairs render and join: 'oat:4 tea:2 rice:1', busiest leading
  return entries.map((e) => '${e.key}:${e.value}').join(' '); // => the line
}
