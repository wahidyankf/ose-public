// Example 70: Analysis Options List the Rules as Data.
//
// Analysis_options.yaml names the lints a project enforces, so the rule
// set is versioned, reviewed, and shared instead of tribal. This example
// carries a sample options file as data and counts its enforced rules,
// proving the project's style contract runs offline with stdlib alone.
void main() {
  // => the sample options as data: the package lints plus two extras
  const options = '''
include: package:lints/recommended.yaml
linter:
  rules:
    - prefer_const_constructors
    - prefer_final_fields
    - always_declare_return_types
''';
  // => rule lines start with a dash: the YAML shape this check relies on
  final rules = options.split('\n').where((l) => l.trim().startsWith('- '));
  // => three enforced extras ride above the recommended set, counted here
  final extra = rules.map((l) => l.trim().substring(2)).toList();
  // => the extras print in file order: the contract, quoted for the record
  print(
      'extra rules: $extra'); // => Output: extra rules: [prefer_const_constructors, prefer_final_fields, always_declare_return_types]
  // => the include line pins the base set: recommended, not the core floor
  // => firstWhere finds it: the only top-level key besides linter below
  final base = options.split('\n').firstWhere((l) => l.startsWith('include:'));
  // => base printed: the set the three extras extend, named for the record
  print(
      'base: $base'); // => Output: base: include: package:lints/recommended.yaml
}
