// Example 69: Imports Sort Themselves into Bands.
//
// Import order is a fixed ritual: dart: first, then package:, then
// relative, each band alphabetical. Readers learn the ritual once and
// never hunt for an import again, and the analyzer's ordering lint keeps
// every file in line without a thought spent. This file imports two
// dart: libraries in order and uses both, proving the first band alive.
import 'dart:convert'; // => first band, alphabetical: convert before math
import 'dart:math'; // => first band, second: math follows convert

void main() {
  // => the order wire: parsed through the convert band member
  final order = jsonDecode('{"crop":"oat","sacks":12}'); // => map, dynamic
  // => the count rides out of the map: one cast where it is used
  final sacks = order['sacks'] as int; // => twelve: the ledger count
  // => the circle check through the math band: pi times radius squared
  final area = pi * 3.0 * 3.0; // => both bands working in one function
  // => sacks print beside the area: convert and math in one transcript
  print(
      'sacks: $sacks, area: ${area.toStringAsFixed(2)}'); // => Output: sacks: 12, area: 28.27
}
