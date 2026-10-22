// Example 15: Null Safety Replaces Null Checks.
//
// Non-nullable types move the missing-value question into the type
// system: the compiler rejects the null before the program ever runs.
// Null-aware operators (?. ?? ??=) handle the values that stay nullable
// by decision, and required named parameters refuse to be forgotten.
void main() {
  // => a stocked name and a missing one: the two null shapes
  print(label('Sari')); // => Output: packed by Sari
  // => null input: the ?? operator supplies the fallback, no if needed
  print(label(null)); // => Output: packed by the morning crew
}

// label names who packed the sack, defaulting when nobody is recorded.
// => String? in, String out: null enters, but null never leaves
// => callers pass a name or nothing: both shapes have answers
String label(String? packer) {
  // => ?? picks the fallback exactly when the left side is null
  final who = packer ?? 'the morning crew'; // => null becomes the crew
  // => past the ??, who is String: the compiler knows null is gone
  return 'packed by $who';
}

// Sack shows required named parameters refusing to be forgotten.
// => name is required: callers cannot omit it, null or otherwise
// => weight stays nullable: an unweighed sack is a fact, not a bug
class Sack {
  // => final fields: a sack's facts never change after packing
  final String name; // => non-nullable: every sack has a name, enforced
  final int? weight; // => nullable by decision: some sacks skip the scale
  // => required name: the compiler rejects a call that forgets it
  const Sack({required this.name, this.weight}); // => weight defaults null
}
