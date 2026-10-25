// ledger.dart: the library half of a part-of pair.
// => the library directive names the unit that part files join
library ledger; // => the name till.dart pledges to with part of

// => the part directive lists every piece of this library
part 'till.dart'; // => one piece: the bonus workshop beside this file

// total closes the day: sales plus the part-file bonus in one call.
int total(List<int> sales) {
  // => same-library call needs no import
  // => fold sums the sales: the book half of the closing count
  final book = sales.fold(0, (sum, s) => sum + s); // => 60 for the demo day
  // => countBonus lives in the part file: shared scope, no prefix
  return book + countBonus(sales); // => 66: the workshop did its share
}

// average reports the mean sale: total over count, floored to whole sacks.
int average(List<int> sales) {
  // => public surface beside total
  // => empty day guards the division: zero sales average to zero
  if (sales.isEmpty) return 0; // => no sales: nothing to average
  // => reuses total: public functions compose like any others
  return total(sales) ~/ sales.length; // => floored mean, whole sacks
}
