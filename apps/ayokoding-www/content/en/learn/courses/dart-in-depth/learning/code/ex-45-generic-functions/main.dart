// Example 45: Generic Functions Work Over Many Types.
//
// A type parameter lets one function serve every type: first<T> returns
// the head of any list without a rewrite per element type. The caller
// pins T by the argument, or names it explicitly when inference needs a
// hand, and the body treats T as an unknown-but-real type throughout.
void main() {
  // => one function, two element types: ints and strings share first
  print(first([10, 20, 30])); // => Output: 10
  // => strings ride the same body: no second implementation exists
  print(first(['oat', 'tea'])); // => Output: oat
  // => explicit pin: names int when the argument leaves doubt (never here)
  print(first<int>([7])); // => Output: 7
  // => describe shows T surviving beside a concrete parameter honestly
  print(describe('sacks', 12)); // => Output: sacks: 12
}

// first returns the head of any non-empty list, whatever it holds.
// => T is the element type: bound by the caller's list, used in the body
// => non-empty is the contract: assert guards it in development, cheaply
T first<T>(List<T> items) {
  // => the guard: empty lists have no head, and callers must know it
  assert(items.isNotEmpty, 'first needs a non-empty list'); // => silent green
  // => index zero: the head, typed T, whatever T the caller pinned
  return items[0]; // => T out: the body never learns which type it served
}

// describe pairs a label with any value: two types, one sentence.
// => two parameters: T for the value, S for the label, both inferred
// => inference reads the arguments: no angle brackets at the call site
String describe<T, S>(S label, T value) => '$label: $value';
