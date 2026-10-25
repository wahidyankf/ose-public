// Example 23: Files Write and Read Back in Full.
//
// File.writeAsStringSync overwrites the whole file and readAsStringSync
// reads it back, so a write-then-read round trip proves the ledger hit
// the disk. ExistsSync checks presence before reading, and deleteSync
// cleans up, keeping the example's footprint to zero after it runs.
import 'dart:io'; // => File, the stdlib handle for whole-file text IO

void main() {
  // => the ledger file lives beside the example: overwritten every run
  final ledger = File('ledger.txt'); // => relative path: the unit directory
  // => write overwrites, never appends: re-runs produce identical bytes
  ledger.writeAsStringSync('oat: 12\ntea: 4\n'); // => two lines, one write
  // => existsSync proves the write landed: presence before reading
  print('written: ${ledger.existsSync()}'); // => Output: written: true
  // => read back the whole file: the round trip proof in one string
  final text = ledger.readAsStringSync(); // => exactly the bytes written
  // => lines splits on newlines: the trailing newline leaves an empty tail
  final lines = text.split('\n'); // => ['oat: 12', 'tea: 4', '']
  // => non-empty lines count the ledger entries: two crops recorded
  final entries = lines.where((line) => line.isNotEmpty).toList();
  // => the count travels with the first entry: proof of content, not bytes
  print(
      'entries: ${entries.length}, first: ${entries.first}'); // => Output: entries: 2, first: oat: 12
  // => deleteSync cleans up: the unit directory is pristine after the run
  ledger.deleteSync(); // => footprint zero: re-runs start identical
  // => absence proves the cleanup: the file is gone, not just empty
  print('cleaned: ${!ledger.existsSync()}'); // => Output: cleaned: true
}
