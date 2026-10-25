// Example 25: String Cases, Padding, and Splitting Shape Text.
//
// The String API shapes text in place: case conversion for display,
// padding for columns, trim for user input edges, and split with join
// for rebuilding lines in a new order. Each method returns a new string,
// so chains read as one shaping sentence.
void main() {
  // => a ragged manifest line: mixed case, stray spaces, comma parts
  const raw = '  Oat,TEA , rice  '; // => user-typed: every wart included
  // => trim shaves the edges: leading and trailing spaces go first
  final trimmed = raw.trim(); // => 'Oat,TEA , rice': edges clean, middle raw
  // => split on commas: three ragged parts, still unshaped inside
  final parts = trimmed.split(','); // => ['Oat', 'TEA ', ' rice']
  // => map trims each part then lowercases: uniform shapes for storage
  final clean = parts.map((p) => p.trim().toLowerCase()).toList();
  // => storage shape: lowercase, no strays, comma-joined for the ledger
  print('stored: ${clean.join(',')}'); // => Output: stored: oat,tea,rice
  // => display shape: first letter up, built per part for the sign
  final sign = clean.map((p) => p[0].toUpperCase() + p.substring(1)).toList();
  // => the sign reads naturally: title case over the same clean parts
  print('sign: ${sign.join(' | ')}'); // => Output: sign: Oat | Tea | Rice
  // => padding aligns columns: names pad right to width six with dots
  final priced = clean.map((p) => p.padRight(6, '.')).toList();
  // => ledger columns: uniform width, values still readable inside
  print('cols: $priced'); // => Output: cols: [oat..., tea..., rice..]
}
