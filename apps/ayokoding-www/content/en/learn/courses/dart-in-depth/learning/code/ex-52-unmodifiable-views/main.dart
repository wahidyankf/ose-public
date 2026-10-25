// Example 52: Unmodifiable Views Share Safely.
//
// UnmodifiableListView wraps a list with a read-only face: readers sort,
// map, and iterate, but every mutating call throws. Sharing the view
// instead of the list hands out the data with the mutation rights held
// back, so one owner's edits never surprise another reader.
import 'dart:collection'; // => UnmodifiableListView, the read-only wrapper

void main() {
  // => the owner's list: mutable, private, the single source of truth
  final owned = ['oat', 'tea', 'rice']; // => insertion order, still growing
  // => the view wraps without copying: reads share, writes are refused
  final menu = UnmodifiableListView(owned); // => read-only face, same data
  // => reads work through the view: join renders the shared contents
  print('menu: ${menu.join(',')}'); // => Output: menu: oat,tea,rice
  // => sorted reads copy first: the view never reorders the owner's list
  final ordered = [...menu]..sort(); // => spread copies, cascade sorts
  // => the copy sorts alphabetically: the view and owner keep insertion
  print('ordered: $ordered'); // => Output: ordered: [oat, rice, tea]
  // => mutation through the view throws: the rights were never granted
  try {
    // => add is refused: UnsupportedError, the read-only enforcement
    menu.add('salt'); // => throws: views do not grow, by design
  } on UnsupportedError {
    // => the exact refusal: caught and reported
    // => the refusal is the lesson: sharing without the mutation rights
    print('refused: add'); // => Output: refused: add
  }
  // => owner still grows: the refusal above protected nobody's data wrongly
  owned.add('salt'); // => owners mutate their own lists freely, as always
  // => the view sees the growth: shared data, single writer, many readers
  print('grown: ${menu.length}'); // => Output: grown: 4
}
