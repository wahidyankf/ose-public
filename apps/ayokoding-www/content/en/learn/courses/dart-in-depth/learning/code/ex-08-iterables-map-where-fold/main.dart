// Example 8: Iterables Transform Lazily with Map, Where, and Fold.
//
// Map, where, and fold return lazy Iterables: no work happens until a
// terminal operation like toList or fold pulls values through. Chaining
// them builds a pipeline that reads as one sentence about the data.
void main() {
  // => sack weights in kilograms: the raw harvest readings
  final weights = [12, 7, 20, 5, 15]; // => five readings, kept in order
  // => where keeps only the heavy sacks: lazy, nothing computed yet
  final heavy = weights.where((w) => w >= 10); // => predicate first, loop never
  // => map converts each survivor: kilograms to grams, still lazy
  final grams = heavy.map((w) => w * 1000); // => one transform per survivor
  // => fold pulls the pipeline: sum with an explicit starting value
  final total = grams.fold(0, (sum, g) => sum + g); // => 12000+20000+15000
  // => the pipeline ran once, end to end: filter, convert, then total
  print('heavy grams: $total'); // => Output: heavy grams: 47000
  // => any asks existence: is any single reading above twenty kilograms?
  final anyHuge = weights.any((w) => w > 20); // => every reading says no
  // => every asks unanimity: are all readings non-negative?
  final allSane = weights.every((w) => w >= 0); // => every reading says yes
  // => two boolean answers: existence first, unanimity second
  print(
      'any huge: $anyHuge, all sane: $allSane'); // => Output: any huge: false, all sane: true
  // => firstWhere finds with a fallback: no throw on a miss
  final firstHeavy = weights.firstWhere((w) => w >= 10, orElse: () => 0);
  // => orElse answers the miss: zero stands in for "no heavy sack"
  print('first heavy: $firstHeavy'); // => Output: first heavy: 12
}
