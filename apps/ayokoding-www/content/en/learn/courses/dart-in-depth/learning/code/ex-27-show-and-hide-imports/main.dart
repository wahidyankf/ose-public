// Example 27: Show and Hide Tame Wide Imports.
//
// Show imports exactly the names a file uses, hiding everything else, so
// readers see the dependency surface without opening the library. Hide
// drops the one colliding name while keeping the rest, which rescues an
// import that would otherwise need a prefix everywhere.
import 'dart:math' show pi, max; // => two names in, the whole rest fenced out
import 'dart:core' hide StateError; // => hide demo: everything but StateError

void main() {
  // => pi arrives bare: show imported exactly this name, nothing else
  final half = pi / 2; // => half-pi: the show list proves pi is allowed in
  // => toStringAsFixed keeps three places: 1.571 for the ledger
  print('half pi: ${half.toStringAsFixed(3)}'); // => Output: half pi: 1.571
  // => max arrives bare too: the second name on the show list
  final cap = max(30, 25); // => 30 wins: the store cap for the season
  // => the cap decides the order size: mill takes at most thirty sacks
  print('cap: $cap'); // => Output: cap: 30
  // => sin is NOT imported: show fenced it out, uncomment to see it fail
  // => print(sin(0)); // => compile error: sin was never shown, by design
  // => the commented line is the lesson: show lists are enforced, not hints
  print('shown: pi, max'); // => Output: shown: pi, max
}
