// Solution: one update call groups every row, branch-free.
// => update with ifAbsent: seed or add in a single map call
// => the branch disappears: the map owns the present-absent decision
void main() {
  // => four rows group into three totals: one call per row, no branch
  print(group([
    ['oat', 12],
    ['tea', 4],
    ['oat', 8]
  ])); // => Output: {oat: 20, tea: 4}
}

// group totals sacks per crop: the update idiom, branch-free and total.
// => update decides present-vs-absent: the map's job, not the loop's
Map<String, int> group(List<List<Object>> rows) {
  // => the totals start empty: update seeds every first sighting itself
  final totals = <String, int>{}; // => crop to running total, map-filled
  // => each row updates: add when present, seed when absent, one call
  for (final row in rows) {
    // => for-in: every row visits the update
    // => key and count cast once: the row's two facts, typed for use
    final crop = row[0] as String; // => the crop name for this row
    // => update owns the branch: present adds, absent seeds, decided inside
    totals.update(crop, (sum) => sum + (row[1] as int),
        ifAbsent: () => row[1] as int); // => oat ends at 20, tea at 4
  }
  // => the totals return: the idiom's whole answer in one less branch
  return totals; // => {oat: 20, tea: 4}: earned the short way
}
