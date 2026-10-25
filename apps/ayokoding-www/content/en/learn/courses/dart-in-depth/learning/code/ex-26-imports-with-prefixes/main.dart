// Example 26: Imports Arrive with Prefixes.
//
// Import prefixes keep two libraries' identical names apart: math.pi and
// convert.jsonDecode name their owners out loud. Prefixes also document
// where every top-level function came from, months after the import was
// written, without opening the import block to check.
import 'dart:math' as math; // => pi, max, and Random live behind math
import 'dart:convert' as convert; // => jsonDecode lives behind convert

void main() {
  // => circle math through the prefix: every name says its library
  final radius = 3.0; // => meters of grain-pile radius, fixed for the demo
  // => math.pi, never bare pi: the prefix proves which pi this is
  final area = math.pi * radius * radius; // => pi r squared, honestly owned
  // => toStringAsFixed trims the decimals: two places for the ledger
  print('area: ${area.toStringAsFixed(2)}'); // => Output: area: 28.27
  // => math.max picks the larger pile without an if in sight
  final bigger = math.max(12, 20); // => 20 wins, prefix and all
  // => the max reads as a decision: bigger pile feeds the mill first
  print('bigger: $bigger'); // => Output: bigger: 20
  // => convert.jsonDecode parses the order wire through its own prefix
  final order = convert.jsonDecode('{"crop":"oat","sacks":5}');
  // => the map arrives typed dynamic: one cast where it is used
  print(
      'order: ${order['crop']} x${order['sacks']}'); // => Output: order: oat x5
}
