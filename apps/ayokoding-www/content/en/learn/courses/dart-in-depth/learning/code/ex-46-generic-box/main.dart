// Example 46: A Generic Box Carries Exactly One Type.
//
// A generic class carries its type parameter on every member: Box<T>
// holds a T, maps it with a T-to-T function, and never confuses oat with
// twelve. Construction pins T once, and the compiler guards every later
// use against mixing the carried type with any other.
void main() {
  // => an int box and a string box: same class, different cargo
  const oat = Box(12); // => Box<int>: inference pins T from twelve
  const name = Box('oat'); // => Box<String>: inference pins T from oat
  // => value reads back typed: ints stay ints, strings stay strings
  print('oat box: ${oat.value}'); // => Output: oat box: 12
  // => map transforms inside the box: the cargo changes, the box stays
  final doubled = oat.map((n) => n * 2); // => Box<int> again: T preserved
  // => doubled holds twenty-four: mapped, reboxed, still an int box
  print('doubled: ${doubled.value}'); // => Output: doubled: 24
  // => names map too: uppercased inside its own string box
  print(
      'shout: ${name.map((s) => s.toUpperCase()).value}'); // => Output: shout: OAT
}

// Box carries one value of type T through maps without ever opening.
// => T pinned at construction: every member agrees on the cargo type
// => immutable: map returns a new box, the old cargo never changes
class Box<T> {
  // => the cargo: final, typed T, set once at construction
  final T value; // => whatever T the caller pinned: int, String, more
  // => const constructor: boxes build at compile time when cargo allows
  const Box(this.value);
  // => map transforms the cargo: T in, T out, new box around the result
  Box<T> map(T Function(T) f) => Box(f(value)); // => same T: never mixed
}
