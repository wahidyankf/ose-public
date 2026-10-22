// Example 32: No Dependency Is a Decision.
//
// Every dependency is code you own without reading: its bugs, its breaks,
// its supply chain. This example groups harvest rows with fold and the
// standard library alone, then prints the dependency it refused to take,
// with the reason attached to the refusal.
void main() {
  // => harvest rows as plain pairs: crop first, sacks second
  const rows = [
    ['oat', 12],
    ['tea', 4],
    ['oat', 8],
    ['rice', 20]
  ];
  // => fold groups into a map: one pass, no package, no ceremony
  final totals = <String, int>{}; // => empty ledger: the fold fills it
  // => each row adds its sacks to its crop's running total
  for (final row in rows) {
    // => for-in: every row visits the ledger once
    // => update with ifAbsent: first sighting seeds, later ones add
    totals.update(row[0] as String, (sum) => sum + (row[1] as int),
        ifAbsent: () => row[1] as int); // => oat ends at 20, tea at 4
  }
  // => grouped with stdlib alone: the ledger proves the refusal below
  print('totals: $totals'); // => Output: totals: {oat: 20, tea: 4, rice: 20}
  // => the refused dependency, named: a grouping package, unneeded here
  print(
      'refused: grouping package (fold already groups)'); // => Output: refused: grouping package (fold already groups)
}
