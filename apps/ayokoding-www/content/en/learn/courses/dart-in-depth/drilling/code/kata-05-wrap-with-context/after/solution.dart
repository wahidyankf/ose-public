// Solution: the failure carries its line number and bad text.
// => BadLine names the failure: line plus text, typed for handlers
// => handlers decide by fields: skip, fix, or abort, with the address
void main() {
  // => two ledger lines: the second carries a bad count, now addressed
  final lines = ['oat,12', 'tea,many']; // => many is not a count, line two
  // => parseAll throws addressed: the catch below learns the line number
  try {
    // => line two throws with its address: BadLine(2, 'many'), data-rich
    print(parseAll(lines)); // => never prints: line two throws addressed
  } on BadLine catch (e) {
    // => the custom class: fields arrive typed
    // => line and text print: operators walk straight to ledger line two
    print('line ${e.line}: ${e.text}'); // => Output: line 2: many
  }
}

// BadLine names a ledger failure with its address: line plus bad text.
// => implements Exception: on-catch clauses name it like Example 13
// => const: failures build as cheap values at the throw site
class BadLine implements Exception {
  // => final address: the line number, one-based for human readers
  final int line; // => one-based: ledger line two, not index one
  // => final evidence: the bad text exactly as the ledger wrote it
  final String text; // => 'many': the count that refused to parse
  // => const constructor: address plus evidence, built at the throw
  const BadLine(this.line, this.text);
}

// parseAll parses every ledger line: addressed throws, context-rich.
// => try around int.parse: the raw failure converts at its address
List<int> parseAll(List<String> lines) {
  // => indexed loop: i+1 is the human line number the failure carries
  final counts = <int>[]; // => parsed counts accumulate in order
  // => each line splits and parses: throws below carry line and text
  for (var i = 0; i < lines.length; i++) {
    // => i+1 addresses the failure
    // => split on comma: count text rides right of the comma
    final parts = lines[i].split(','); // => parts[1] is the count text
    // => convert the raw throw: catch names the line, throws the address
    try {
      // => the risky parse: 'many' throws FormatException, caught below
      counts.add(int.parse(parts[1])); // => line two throws here, addressed
    } on FormatException {
      // => no binding: the address matters, not fields
      // => throw addressed: line number plus bad text, typed for handlers
      throw BadLine(i + 1, parts[1]); // => line 2, 'many': operators guided
    }
  }
  // => the counts return: reached only when every line parses cleanly
  return counts; // => unreachable in the demo: line two always throws
}
