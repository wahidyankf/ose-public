// main.dart: the capstone CLI. Reads input.txt, grades every line,
// and prints the report: receipts for honest lines, addressed skips for
// bad ones. IO lives only here: the rules live in grading.dart, pure
// and tested, exactly the shell-and-core split Example 41 teaches.
import 'dart:io'; // => File: the whole-file read of the ledger input
import 'grading.dart'; // => the pure core: parseLine, band, gradeLines

void main() {
  // => the ledger input lives beside the CLI: overwritten never, read always
  final raws = File('input.txt').readAsLinesSync(); // => six lines, two bad
  // => the pure core renders: receipts beside skips, ledger order kept
  final report = gradeLines(raws); // => six lines in, six lines out
  // => the golden transcript: printed in order, recorded by the harness
  for (final line in report) {
    // => for-in: every report line prints once
    // => one line per ledger line: receipts and skips share the transcript
    print(line); // => six lines: four receipts, two addressed skips
  }
}
