// grading.dart: the pure grading core the capstone CLI and checks share.
//
// Parsing, banding, and reporting live here with no IO inside: main.dart
// handles the file, check.dart handles the proofs, and this library owns
// the rules. Pure cores test like Example 41 teaches: tables of input
// and want, no fixtures, no clock, no files anywhere in sight.
library grading; // => the library importers name: main and check alike

// GradingError names a ledger-line failure with its line number.
// => implements Exception: handlers catch the class, read the fields
// => const: failures build as cheap values at the refusal site
class GradingError implements Exception {
  // => final address: the one-based ledger line that refused to parse
  final int line; // => one-based: humans count ledger lines from one
  // => final evidence: the reason this line failed, written at the site
  final String reason; // => 'empty name' or 'bad score', decided here
  // => const constructor: address plus reason, built where thrown
  const GradingError(this.line, this.reason);
  // => the sentence: line, reason, both fields, ready for the report
  @override
  String toString() => 'line $line: $reason'; // => skip lines quote this
}

// parseLine reads 'name,score' into a record: the pipeline's first stage.
// => (String, int): the shaped pair every later stage plugs into
// => throws GradingError: failures carry their line number from birth
(String, int) parseLine(String raw, int line) {
  // => split once: name left of the comma, score text right of it
  final parts = raw.split(','); // => exactly two parts per honest line
  // => the name must exist: empty names fail with their line number
  final name = parts[0].trim(); // => trimmed: ' Sari ' parses as Sari
  // => empty name throws addressed: the handler learns the line at once
  if (name.isEmpty) throw GradingError(line, 'empty name'); // => line 3 demo
  // => the score must parse: bad counts fail with the offending text
  final score = int.tryParse(parts.length > 1 ? parts[1].trim() : '');
  // => null parse throws addressed: 'many' names itself in the reason
  if (score == null)
    throw GradingError(
        line, "bad score '${parts.length > 1 ? parts[1].trim() : ''}'");
  // => the record builds: name beside score, shaped for grading
  return (name, score); // => ('Sari', 95): the pipeline's first product
}

// band grades one score: the four promises Example 43 pins by table.
// => ordered guards: the first true band wins, top band checked first
// => pure: scores in, letters out, nothing else consulted anywhere
String band(int score) {
  // => ninety and above: the top band, checked before all others
  if (score >= 90) return 'A'; // => excellence: the ceiling promise
  // => seventy-five and above: the good band below excellence
  if (score >= 75) return 'B'; // => solid: the middle promise
  // => sixty and above: the passing floor, the weakest promise kept
  if (score >= 60) return 'C'; // => passing: the floor promise
  // => below sixty: the failing band every low score honestly earns
  return 'F'; // => failing: the honesty promise for low scores
}

// gradeLines renders the whole ledger: receipts beside addressed skips.
// => GradingError caught per line: one bad line never sinks the ledger
// => skip lines quote the failure: operators walk straight to the address
List<String> gradeLines(List<String> raws) {
  // => the report grows per line: receipts and skips in ledger order
  final report = <String>[]; // => order kept: line order is the transcript
  // => indexed walk: i + 1 addresses every failure like a human counts
  for (var i = 0; i < raws.length; i++) {
    // => line numbers ride along
    // => each line parses inside try: addressed failures land below
    try {
      // => parse then band: the two pure stages composed per line
      final record = parseLine(raws[i], i + 1); // => shaped pair, or throw
      // => receipt renders: name, band, score, the sentence the sign shows
      report.add('${record.$1}: ${band(record.$2)} (${record.$2})');
    } on GradingError catch (e) {
      // => addressed: line number rides along
      // => skip quotes the failure: operators walk to the exact line
      report.add('skip $e'); // => 'skip line 3: empty name', and friends
    }
  }
  // => the whole report: receipts and skips, ledger order, printable
  return report; // => main prints it: the golden transcript below
}
