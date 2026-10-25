// Starter: bare rethrow loses context. The bug: which line broke?
// => raw FormatException: the handler learns nothing about the ledger line
// => rewrite: custom exception with line number, like Example 13
void main() {
  // => two ledger lines: the second carries a bad count, anonymously
  final lines = ['oat,12', 'tea,many']; // => many is not a count, line two
  // => parse throws raw: the catch below cannot name the guilty line
  try {
    // => parseAll throws on 'many': context-free, line number lost
    print(parseAll(lines)); // => never prints: line two throws first
  } catch (e) {
    // => the handler asks which line: the failure stays silent
    // => BUG: no line number: operators guess between line one and two
    print('bad ledger: $e'); // => names the failure, never its address
  }
}

// parseAll parses every ledger line: raw throws, context-free.
// => BUG: int.parse throws bare: the line number never joins the failure
List<int> parseAll(List<String> lines) {
  // => indexed loop: the line number exists here, then gets discarded
  final counts = <int>[]; // => parsed counts accumulate in order
  // => each line splits and parses: the throw below forgets its address
  for (var i = 0; i < lines.length; i++) {
    // => i knows the line number
    // => split on comma: count text rides right of the comma
    final parts = lines[i].split(','); // => parts[1] is the count text
    // => BUG: bare parse: 'many' throws with no line number attached
    counts.add(int.parse(parts[1])); // => line two throws here, anonymously
  }
  // => the counts return: reached only when every line parses cleanly
  return counts; // => unreachable in the demo: line two always throws
}
