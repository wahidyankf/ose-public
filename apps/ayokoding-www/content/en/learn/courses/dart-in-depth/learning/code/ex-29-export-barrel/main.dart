// main.dart: the importer of the shelf barrel.
//
// The barrel is the only import: Fruit and stockLine arrive through
// shelf.dart, and fruit.dart is never named here. One import per shelf
// keeps the import block proportional to the ideas used.
import 'shelf.dart'; // => the barrel: names and verbs ride along together

void main() {
  // => Fruit builds through the barrel: const, named, counted
  const item = Fruit('oat', 12); // => the barrel resold the constructor too
  // => the barrel verb renders the line: verbs travel with the names
  print(stockLine(item)); // => Output: shelf: oat x12
}
