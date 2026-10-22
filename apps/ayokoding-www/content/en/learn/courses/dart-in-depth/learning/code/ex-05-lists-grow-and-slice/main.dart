// Example 5: Lists Grow, Slice, and Spread.
//
// A Dart List keeps insertion order, grows with add, and copies ranges
// with sublist. Spreads (...) splice one list into another, and the
// null-aware spread (...?) skips a null source instead of crashing.
void main() {
  // => start small: the list grows as the example learns more items
  final items = ['oat']; // => one element: the list literal sets the type
  // => add appends one: the idiomatic way to grow a list
  items.add('tea'); // => length is now two, order kept as inserted
  // => addAll appends many: one call for a whole harvest of items
  items.addAll(['rice', 'sugar']); // => length is now four in order
  // => length reports the count: the number every loop bound uses
  print('all: $items'); // => Output: all: [oat, tea, rice, sugar]
  // => sublist copies a half-open range: start in, end out
  final staples = items.sublist(0, 2); // => indexes 0 and 1: oat and tea
  // => the copy is independent: later edits to items leave staples alone
  print('staples: $staples'); // => Output: staples: [oat, tea]
  // => spread splices a list into a bigger literal, keeping order
  final pantry = ['salt', ...staples, 'pepper']; // => salt, oat, tea, pepper
  // => null-aware spread skips null: no crash when the source is missing
  List<String>? extra; // => nullable list: absent until someone stocks it
  // => ...? on a null source adds nothing and throws nothing
  final full = [...pantry, ...?extra]; // => extra is null: skipped silently
  // => sorted is a copy: sort the copy so the original order survives
  final ordered = [...full]..sort(); // => cascade sorts the copy in place
  // => alphabetical order for display; insertion order kept in full
  print('ordered: $ordered'); // => Output: ordered: [oat, pepper, salt, tea]
}
