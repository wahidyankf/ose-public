// Example 30: The Pubspec Pins the Project.
//
// The pubspec names the package, pins the SDK range it builds under, and
// lists the dependencies it refuses to live without. This example carries
// a sample pubspec as data and checks its three load-bearing lines, so
// the pinning convention runs offline with the standard library alone.
void main() {
  // => the sample pubspec as data: name, environment, dependencies
  const pubspec = '''
name: pantry_ledger
environment:
  sdk: ^3.0.0
dependencies:
  args: ^2.4.0
''';
  // => split into lines: each load-bearing line is checked by name below
  final lines = pubspec.split('\n'); // => blank edges included, harmless
  // => the name line pins the package identity: first non-empty line
  final name = lines.firstWhere((l) => l.startsWith('name:'));
  // => identity proven: the project is pantry_ledger, not a stray folder
  print('name: $name'); // => Output: name: pantry_ledger
  // => the sdk line pins the toolchain range: caret means compatible-newer
  final sdk = lines.firstWhere((l) => l.contains('sdk:'));
  // => split on the colon: the range text rides on the right side
  final range = sdk.split(':').last.trim(); // => ^3.0.0: at least 3, below 4
  // => caret range: 3.0.0 and above, below 4.0.0, excluding the next major
  print('sdk range: $range'); // => Output: sdk range: ^3.0.0
  // => dependencies list every outsider: one here, each version-pinned
  final deps = lines.where((l) => l.startsWith('  args:')).toList();
  // => a single pinned outsider: args at caret 2.4.0, locked at resolve time
  print('deps: ${deps.length} pinned'); // => Output: deps: 1 pinned
}
