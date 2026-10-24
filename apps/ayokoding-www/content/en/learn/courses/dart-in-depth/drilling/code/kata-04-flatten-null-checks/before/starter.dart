// Starter: nested null checks. The bug: the happy path sits three deep.
// => pyramid of doom: each missing value indents the answer further
// => rewrite: ?? chain like Example 15, one line, happy path at margin
void main() {
  // => three lookups: stocked, missing crop, missing ledger entirely
  print(label('Sari', {'Sari': 'east'})); // => east: buried three deep
  // => missing packer falls to the crew: nested three levels to say so
  print(label(null, {'Sari': 'east'})); // => crew: correct, unreadable
}

// label names the packer site: correct, and nested past all skimming.
// => BUG: pyramid nesting: each ?? below replaces one whole level here
String? label(String? packer, Map<String, String>? sites) {
  // => level one: no packer means the crew, decided three lines early
  if (packer != null) {
    // => packer present: descend for the site lookup
    // => level two: no ledger means the crew too, one indent deeper
    if (sites != null) {
      // => ledger present: descend for the site itself
      // => level three: the site or the crew, at maximum indentation
      if (sites.containsKey(packer)) {
        // => deepest question of the three
        // => the happy path: three indents from the margin, found at last
        return sites[packer]; // => east: earned through the whole pyramid
      } else {
        // => known packer, unknown site: the crew, deeply nested
        return 'crew'; // => fallback one of three identical sentences
      }
    } else {
      // => no ledger at all: the crew, at indent level two
      return 'crew'; // => fallback two of three identical sentences
    }
  } else {
    // => no packer at all: the crew, at indent level one
    return 'crew'; // => fallback three of three identical sentences
  }
}
