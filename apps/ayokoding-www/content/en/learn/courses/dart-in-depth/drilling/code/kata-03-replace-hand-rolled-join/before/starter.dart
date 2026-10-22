// Starter: hand-rolled join. The bug: flags and indexes around one call.
// => separator flag: first-iteration logic no reader can skim past
// => rewrite: names.join(', ') like Example 25, one call, no flag
void main() {
  // => three crops join here: the flag below decides every comma by hand
  print(joinCrops(['oat', 'tea', 'rice'])); // => oat,tea,rice, if flags align
}

// joinCrops concatenates with commas: correct, and needlessly manual.
// => BUG: hand-rolled separator: the exact loop join() already owns
String joinCrops(List<String> crops) {
  // => the accumulator starts empty: every comma below is deliberated
  var out = ''; // => empty: the first crop must skip the separator
  // => first flag: tracks whether a comma is owed before the next crop
  var first = true; // => mutable flag: the reader's tax on every pass
  // => each crop appends: comma first unless the flag says otherwise
  for (final crop in crops) {
    // => for-in: the loop join replaces
    // => flag check per crop: separator logic repeated, never reused
    if (!first) out += ','; // => commas between, never before the first
    // => crop appends: the only line the stdlib version keeps
    out += crop; // => oat, then ,tea, then ,rice, flag permitting
    // => flag clears: exactly once, or every comma doubles from here
    first = false; // => one missed reset corrupts the whole line
  }
  // => the joined line: right today, fragile on every future edit
  return out; // => oat,tea,rice: earned the hard way, kept the risky way
}
