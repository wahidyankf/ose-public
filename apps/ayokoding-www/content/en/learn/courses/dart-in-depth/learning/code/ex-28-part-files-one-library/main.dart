// main.dart: the importer of the ledger library.
//
// Importers see one library, not its part files: ledger.dart is the whole
// public surface, and till.dart stays invisible behind it. This file runs
// the day's sales through total and prints the closed-day count.
import 'ledger.dart'; // => the library, not the part: parts never import

void main() {
  // => three sales clear three rungs: the bonus maxes at six sacks
  final day = [10, 20, 30]; // => sixty in sales, three rungs reached
  // => total folds sales and adds the part-file bonus in one call
  final closed = total(day); // => 60 plus 6: the part file did its share
  // => the closed-day count: public surface, private workshop behind it
  print('closed: $closed'); // => Output: closed: 66
  // => average composes total: the mean sale through the same surface
  print('average: ${average(day)}'); // => Output: average: 22
}
