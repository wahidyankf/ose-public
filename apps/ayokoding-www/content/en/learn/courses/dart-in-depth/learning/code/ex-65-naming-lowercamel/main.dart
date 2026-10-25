// Example 65: Names Follow lowerCamelCase.
//
// Effective Dart fixes the cases: UPPER_CAMEL for types, lowerCamel for
// members and variables, lowercase_with_underscores for files and
// packages. This example maps each declaration kind to its case in one
// table the analyzer's naming lints already enforce, so the printed map
// doubles as the rule card for every identifier below.
void main() {
  // => the case table: kind beside case, enforced by lint and by eye
  const cases = {
    // => const map: the rule card never changes
    'class': 'UpperCamel', // => types read as names: Mill, Sack, Order
    'member': 'lowerCamel', // => members read as verbs: weigh, tare, total
    'variable': 'lowerCamel', // => locals match members: sacks, ledger
    'file': 'snake_case', // => files sort quietly: stock_line, till
    'constant': 'lowerCamel', // => consts match vars: quota, millCap
  };
  // => each row prints kind, arrow, case: the rule card in five lines
  for (final entry in cases.entries) {
    // => entries keep insertion order
    // => arrow format: kind on the left, case on the right, aligned
    print('${entry.key} -> ${entry.value}'); // => five rows, five rules
  }
}
