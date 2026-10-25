// Example 34: Initialization Runs in a Fixed Order.
//
// Field initializers run before the constructor body, initializer lists
// before super calls, and static fields once on first use. Late fields
// wait until first read. Knowing the order turns construction from a
// mystery into a checklist the example prints as it happens.
void main() {
  // => building the mill runs the whole order: watch the printed numbers
  final mill = Mill('east'); // => construction prints steps one to four
  // => the mill remembers its ledger: built during construction, read now
  print('ledger: ${mill.ledger}'); // => Output: ledger: east: open
}

// Mill records its construction order in the ledger it keeps.
// => field initializers first, then the initializer list, then the body
// => late fields wait: groundOpens builds on first read, not before
class Mill {
  // => step 1: field initializers run the moment construction starts
  final String opened = _step('1 field', 'open');
  // => the site arrives as a parameter: claimed by the constructor below
  final String site; // => set once, in the header, never reassigned
  // => the ledger stores the site: filled by the initializer list in step 2
  final String ledger; // => assigned once below: final fields allow one shot
  // => late waits: no work until something reads groundOpens, which nobody
  // => does in this run: step 4 never prints, proving lateness by absence
  late final String groundOpens = _step('4 late ground', 'dawn');
  // => step 2: the initializer list runs before the body, after fields
  Mill(this.site) : ledger = _step('2 init list', '$site: open') {
    // => step 3: the body runs last: everything above is already stored
    _step('3 body', 'crew awake'); // => recorded, return ignored by design
  }
  // => _step records its number and returns the value: order made visible
  static String _step(String n, String value) {
    // => each construction step announces itself in order: 1, 2, 3, late
    print('init $n'); // => steps print during construction, before ledger
    // => the value flows into the field: recording never blocks storing
    return value; // => ledger keeps 'east: open', ground keeps 'dawn'
  }
}
