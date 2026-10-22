// Example 19: RegExp Finds Every Pattern Match.
//
// RegExp compiles a pattern once and allMatches finds every non-empty
// hit with its groups. HasMatch answers existence, stringMatches in a
// newer style, and replaceAll rewrites through the same pattern object.
void main() {
  // => one pattern for sack codes: two letters, a dash, three digits
  final code = RegExp(r'[a-z]{2}-\d{3}'); // => raw string: no escape doubling
  // => the manifest line hides two valid codes among plain words
  const line = 'load ot-101 and rc-205 before dusk'; // => two hits inside
  // => allMatches finds both: each match knows its span and group zero
  final hits = code.allMatches(line).toList(); // => terminal op: matches now
  // => two hits: ot-101 first, rc-205 second, in encounter order
  print('hits: ${hits.length}'); // => Output: hits: 2
  // => group zero is the whole match: the code exactly as written
  print('first: ${hits.first.group(0)}'); // => Output: first: ot-101
  // => hasMatch answers existence without building the match list
  print('any: ${code.hasMatch('no codes here')}'); // => Output: any: false
  // => replaceAll rewrites through the pattern: codes become parcels
  final masked = line.replaceAll(code, 'parcel'); // => both codes replaced
  // => plain words survive: only the pattern spans change
  print(
      'masked: $masked'); // => Output: masked: load parcel and parcel before dusk
}
