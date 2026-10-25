// Example 47: Bounded Type Parameters Promise a Shape.
//
// T extends num promises the body that every T supports addition, so one
// total serves ints and doubles without a dynamic escape hatch. Bounds
// turn 'any type' into 'any type with this shape', and the compiler
// checks the promise at the call site instead of trusting the body.
void main() {
  // => ints total through the bound: numbers add, promise kept
  print(total([1, 2, 3])); // => Output: 6
  // => doubles total through the same body: one function, two number kinds
  print(total([1.5, 2.5])); // => Output: 4.0
  // => longest picks by shape too: Comparable bounds order any rankable
  print(longest(['oat', 'sugar', 'tea'])); // => Output: sugar
  // => ints rank as well: the same bound serves numbers and strings
  print(longest([3, 30, 9])); // => Output: 30
}

// total sums any list of numbers: ints today, doubles tomorrow.
// => T extends num: the bound promises + to the body, no cast needed
// => returns num: the honest sum type when kinds mix across calls
// => callers pin T by list: int lists and double lists both qualify
num total<T extends num>(List<T> items) {
  // => fold from zero: + is guaranteed by the bound on every element
  return items.fold(0, (sum, item) => sum + item); // => 6 and 4.0 below
}

// longest returns the greatest of non-empty rankables by natural order.
// => T extends Comparable: the bound promises compareTo to the body
// => strings and ints both qualify: rankable covers words and numbers
T longest<T extends Comparable<dynamic>>(List<T> items) {
  // => the contract: ranks need at least one contender to compare
  assert(items.isNotEmpty, 'longest needs a non-empty list'); // => silent green
  // => fold the max: compareTo decides, the bound guarantees it exists
  return items.fold(
      items.first,
      (best, item) => // => seed with the head
          item.compareTo(best) > 0 ? item : best); // => greater replaces best
}
