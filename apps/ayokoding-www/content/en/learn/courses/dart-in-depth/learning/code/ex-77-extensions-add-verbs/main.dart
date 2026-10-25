// Example 77: Extensions Add Verbs to Borrowed Types.
//
// Extension methods hang new verbs on types you do not own: String gains
// a sack-line parser, int gains a trip counter, and no wrapper class is
// ever built. Reading extension code means checking the receiver first:
// the verb belongs to the type on the left of the dot, and the body only
// fills in what the name already promised.
void main() {
  // => the manifest line parses through its own verb: no helper in sight
  const line = 'oat,12'; // => crop comma count: the shape the verb expects
  // => parseSack hangs on String: the receiver carries its own parser
  print(line.parseSack()); // => Output: oat holds 12
  // => trips hangs on int: sack counts know their own cart math
  print(10.trips(3)); // => Output: 4 trips
  // => verbs chain on receivers: words split, then count themselves
  print('oat oat tea'.wordCount); // => Output: 3 words
}

// SackParsing hangs a manifest parser on every string in the program.
// => on String: the receiver type named once, verbs available everywhere
// => verbs read as members: line.parseSack, never parseSack(line)
extension SackParsing on String {
  // => parseSack splits crop-comma-count into the holding sentence
  String parseSack() {
    // => the receiver is the manifest line itself
    // => split once: crop left of the comma, count text right of it
    final parts = split(','); // => split on this: the receiver's own text
    // => the sentence builds: crop holds count, parsed to int for proof
    return '${parts[0]} holds ${int.parse(parts[1])}'; // => oat holds 12
  }

  // wordCount counts the words in any string: split and count, one verb.
  int get wordCount => split(' ').length; // => getter verb: reads as a noun
}

// CartMath hangs trip counting on every int: counts know their own carts.
extension CartMath on int {
  // => trips divides the count by capacity, rounding the remainder up
  int trips(int perTrip) => (this + perTrip - 1) ~/ perTrip; // => 4 above
}
