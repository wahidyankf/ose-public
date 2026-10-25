// Starter: grouping by hand. The bug: containsKey branches per row.
// => branch per row: lookup, test, then set, spelled out every time
// => rewrite: update with ifAbsent like Examples 6 and 32, one call
void main() {
  // => four rows group into three totals: branched, correct, verbose
  print(group([
    ['oat', 12],
    ['tea', 4],
    ['oat', 8]
  ])); // => oat 20, tea 4
}

// group totals sacks per crop: branched lookups, spelled out by hand.
// => BUG: containsKey dance: the update call below owns this whole shape
Map<String, int> group(List<List<Object>> rows) {
  // => the totals start empty: every crop below is a first sighting
  final totals = <String, int>{}; // => crop to running total, hand-filled
  // => each row branches: present adds, absent seeds, decided by hand
  for (final row in rows) {
    // => for-in: every row visits the branch
    // => key and count cast once: the row's two facts, typed for use
    final crop = row[0] as String; // => the crop name for this row
    // => count cast: the sacks this row contributes to the total
    final sacks = row[1] as int; // => the contribution, typed int
    // => BUG: the branch update already owns: lookup, test, then set
    if (totals.containsKey(crop)) {
      // => seen before: add to the total
      // => present adds: read, add, write, three steps for one idea
      totals[crop] = totals[crop]! + sacks; // => oat climbs 12 then 20
    } else {
      // => absent seeds: the first sighting starts the total here
      totals[crop] = sacks; // => tea seeds at 4, oat seeded at 12
    }
  }
  // => the totals return: right, and three times longer than the idiom
  return totals; // => {oat: 20, tea: 4}: earned through the branch
}
