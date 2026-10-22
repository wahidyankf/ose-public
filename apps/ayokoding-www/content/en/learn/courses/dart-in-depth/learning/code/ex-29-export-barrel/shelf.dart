// shelf.dart: the barrel that resells the fruit shelf.
// => export resells fruit.dart: importers see Fruit, never fruit.dart
// => export alone never imports: the barrel imports for its own use too
import 'fruit.dart'; // => own use: stockLine below names Fruit directly
export 'fruit.dart'; // => the whole Fruit surface, resold under shelf

// stockLine renders one shelf line: barrels add verbs, not just names.
// => the face stays one import per idea while the workshop grows behind
String stockLine(Fruit item) {
  // => Fruit arrives via the export above
  // => fields read straight through: no trace of the two-file split
  return 'shelf: ${item.name} x${item.sacks}'; // => the line, ready to print
}
