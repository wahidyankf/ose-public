// Example 18: StringBuffer Builds Text Without the Copies.
//
// Adding to a String in a loop copies the whole string every time, while
// StringBuffer appends into a builder and materializes once. Writes go in
// with write and writeln; toString cashes out the finished text exactly
// once, which is the performance idiom for assembled reports.
void main() {
  // => the buffer starts empty: appends accumulate, nothing copies yet
  final report = StringBuffer(); // => the builder every line below feeds
  // => writeln appends plus a newline: one call per report line
  report.writeln('harvest report'); // => first line staged, no copy made
  // => write appends without a newline: for fragments sharing a line
  report.write('oat: '); // => label staged, value follows on the same line
  // => interpolation inside write: values format at append time
  report.writeln(12); // => the line completes: 'oat: 12' plus newline
  // => headers and rows share the buffer: order of appends is the order
  report.writeln('tea: 4'); // => second crop line, same treatment
  // => toString materializes once: the single copy the loop avoided
  final text = report.toString(); // => three lines, one trailing newline
  // => length counts every character staged, newlines included
  print('chars: ${text.length}'); // => Output: chars: 28
  // => trim removes the trailing newline for the display line below
  print('first: ${text.split('\n').first}'); // => Output: first: harvest report
}
