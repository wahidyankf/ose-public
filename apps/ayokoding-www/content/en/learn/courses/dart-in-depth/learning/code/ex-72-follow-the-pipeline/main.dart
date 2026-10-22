// Example 72: Follow the Pipeline Through Its Stages.
//
// Pipelines read stage by stage: each function's output type plugs the
// next function's input, and the main composes them in order. This
// ledger pipeline parses rows, validates counts, and totals the valid,
// and tracing one row through the three stages explains the whole file
// faster than reading any single stage twice.
void main() {
  // => three raw rows: two honest, one with a negative count to refuse
  const rows = ['oat,12', 'tea,-4', 'rice,20']; // => the traced material
  // => parse stage: raw text becomes records, shape (crop, sacks) each
  final parsed = rows.map(parseRow).toList(); // => three records, one bad
  // => validate stage: negative counts fall out, honest rows pass through
  final valid = parsed.where((r) => r.$2 >= 0).toList(); // => tea refused
  // => total stage: the survivors fold into the day's honest count
  final total = valid.fold(0, (sum, r) => sum + r.$2); // => 12 plus 20
  // => the pipeline lands: total beside the refused count, both reported
  print(
      'total: $total, refused: ${parsed.length - valid.length}'); // => Output: total: 32, refused: 1
}

// parseRow splits 'crop,sacks' into a record: the pipeline's first stage.
// => (String, int): the shaped pair every later stage plugs into
// => int.parse trusts the comma format: the course's honest-input idiom
(String, int) parseRow(String row) {
  // => split once: crop left of the comma, count text right of it
  final parts = row.split(','); // => exactly two parts per honest row
  // => the record builds: name as text, count parsed to int, shaped
  return (parts[0], int.parse(parts[1])); // => tea parses to -4, kept for now
}
