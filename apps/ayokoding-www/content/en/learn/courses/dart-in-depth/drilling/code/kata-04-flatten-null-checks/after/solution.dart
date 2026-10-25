// Solution: one ?? chain replaces the three-level pyramid.
// => fallbacks read left to right: packer, site, crew, in one line
// => happy path at the margin: no indent deeper than the function body
void main() {
  // => stocked packer resolves the site: the chain's first link holds
  print(label('Sari', {'Sari': 'east'})); // => Output: east
  // => missing packer skips to the crew: the chain's last link answers
  print(label(null, {'Sari': 'east'})); // => Output: crew
  // => missing ledger skips the middle: null-aware lookup, same answer
  print(label('Sari', null)); // => Output: crew
}

// label names the packer site through one fallback chain, flat and total.
// => sites?[packer] is null when the ledger or the entry is missing
// => ?? picks crew exactly when the left side resolves to null
String label(String? packer, Map<String, String>? sites) {
  // => packer null means crew before lookup: the chain's first fallback
  // => lookup null means crew after: the chain's second fallback, same line
  return packer == null ? 'crew' : (sites?[packer] ?? 'crew'); // => flat
}
