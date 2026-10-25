// fruit.dart: one shelf item behind the barrel.
//
// Fruit names the stocked item: small, focused, and imported by nobody
// directly once the barrel exists. Its surface is one class with const
// construction, built for shelves to resell.
class Fruit {
  // => final fields: a fruit's facts never change after picking
  final String name; // => the crop name, always present
  final int sacks; // => the count, always a whole number
  // => const constructor: fruits build at compile time
  const Fruit(this.name, this.sacks);
}
