// till.dart: the part-file half of the ledger library.
// => part of pledges this file to ledger: shared scope, never imported
part of ledger; // => the pledge: same library, invisible to importers

// countBonus awards two sacks per rung reached, capped at three rungs.
int countBonus(List<int> sales) {
  // => private to the library: total calls it
  // => rungs reached: one per sale, capped at three, bonus two each
  final rungs = sales.length > 3 ? 3 : sales.length; // => cap keeps it honest
  // => two sacks per rung: the workshop arithmetic behind total
  return rungs * 2; // => 6 for the three-sale demo day
}
