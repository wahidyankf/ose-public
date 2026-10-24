// Example 51: Equality by Value, Not by Identity.
//
// Default == asks 'same object', but value types must ask 'same facts':
// override == to compare fields and hashCode to join them, so equal
// values behave equal in sets and as map keys. The contract is three
// lines: same type, same fields, joined hash, or collections misbehave.
void main() {
  // => two separately-built sacks with identical facts: twins, not one
  final a = Sack('oat', 12); // => non-const: distinct objects by default
  final b = Sack('oat', 12); // => equal facts, different identity
  // => default identity would say false: the override says true instead
  print('equal: ${a == b}'); // => Output: equal: true
  // => sets obey == and hashCode: the twin collapses to one member
  final set = {a, b}; // => two inserts, one member: equality at work
  // => length one proves the contract: hash joined, equality compared
  print('set size: ${set.length}'); // => Output: set size: 1
  // => map keys obey it too: the twin overwrites instead of doubling
  final ledger = {a: 'first'}; // => one entry keyed by the oat facts
  // => twin key stores into the same slot: lookup by value, not identity
  ledger[b] = 'second'; // => overwrites: b equals a, same slot claimed
  // => one entry left: value equality governs keys exactly like sets
  print('ledger: ${ledger.length} ${ledger[a]}'); // => Output: ledger: 1 second
}

// Sack compares by facts: same crop and count means the same sack.
// => == by fields: type check first, then every field in turn
// => hashCode joins fields: equal objects must hash equal, always
class Sack {
  // => final facts: equality is stable only over immutable fields
  final String name; // => the crop: first half of the value key
  final int sacks; // => the count: second half of the value key
  // => constructor: non-const twins prove == without canonical sharing
  Sack(this.name, this.sacks); // => plain: identity differs, facts match
  // => == override: same type plus same fields, nothing else qualifies
  @override
  bool operator ==(Object other) => // => Object: == must accept anything
      other is Sack && other.name == name && other.sacks == sacks;
  // => hashCode joins both fields: the stdlib hash combiner, one call
  @override
  int get hashCode => Object.hash(name, sacks); // => equal in, equal out
}
