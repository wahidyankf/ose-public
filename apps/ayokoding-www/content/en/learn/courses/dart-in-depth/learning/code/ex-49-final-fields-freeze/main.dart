// Example 49: Final Fields Freeze Instances.
//
// Final fields assign once and never move: construction sets them, and
// every later read sees the same values. Mutable state still lives in
// clearly-marked non-final fields, so readers trust finals at a glance
// and audit only the few fields that can still change.
void main() {
  // => the mill opens with east site and an empty log of the day
  final mill = Mill('east'); // => finals set here: site fixed for life
  // => site reads back exactly as constructed: finals never drift
  print('site: ${mill.site}'); // => Output: site: east
  // => visits counts arrivals: the one mutable field, marked by var
  mill.visit(); // => first arrival: the mutable counter ticks to one
  // => visit again: finals would forbid this; the var field allows it
  mill.visit(); // => second arrival: counter ticks to two, site untouched
  // => two visits counted: mutation confined to the marked field
  print('visits: ${mill.visits}'); // => Output: visits: 2
  // => site still east: a thousand visits could never move a final
  print('still: ${mill.site}'); // => Output: still: east
}

// Mill freezes its identity at construction and counts visits mutable.
// => final site: set once, read forever, never reassigned anywhere
// => visits stays var: the honest marker of the one changing field
class Mill {
  // => final identity: every Mill is its site, permanently
  final String site; // => assigned by the constructor, read ever after
  // => the mutable counter: var marks the field readers must re-check
  int visits = 0; // => starts at zero: no visitor has arrived yet
  // => constructor claims the site: the single assignment finals allow
  Mill(this.site); // => this.site: the idiom for final field capture
  // => visit ticks the counter: the only mutation this class performs
  void visit() => visits++; // => finals forbid the rest: this is all
}
