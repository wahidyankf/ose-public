// Example 48: Const Builds Canonical Values.
//
// Const constructors build compile-time values, and identical const
// expressions share one canonical object: two const sacks with equal
// fields are the same object, not two twins. Final fields make the
// sharing safe, because canonical values can never change under anyone.
void main() {
  // => two const builds with equal fields: one canonical object behind both
  const a = Sack('oat', 12); // => compile-time value: fields fixed forever
  const b = Sack('oat', 12); // => same fields: the compiler shares the one
  // => identical proves the sharing: same object, not merely equal twins
  print('shared: ${identical(a, b)}'); // => Output: shared: true
  // => differing fields build a second canonical value beside the first
  const c = Sack('tea', 4); // => different fields: a different canonical one
  // => not identical: canonical sharing keys on all the field values
  print('split: ${identical(a, c)}'); // => Output: split: false
  // => equality by == agrees: same fields compare equal, sharing or not
  print('equal: ${a == b}'); // => Output: equal: true
}

// Sack is one immutable ledger line: const-built and canonically shared.
// => final fields: canonical values are safe only because none can change
// => == by fields: sharing is an optimization, equality is the contract
class Sack {
  // => final fields: a sack's facts never change after construction
  final String name; // => the crop name, part of the canonical key
  final int sacks; // => the count, part of the canonical key
  // => const constructor: equal arguments share one canonical object
  const Sack(this.name, this.sacks);
  // => == compares fields: true for twins whether shared or separate
  @override
  bool operator ==(Object other) => // => the equality contract, by hand
      other is Sack && other.name == name && other.sacks == sacks;
  // => hashCode joins the fields: equal objects hash equal, as required
  @override
  int get hashCode => Object.hash(name, sacks); // => the stdlib joiner
}
