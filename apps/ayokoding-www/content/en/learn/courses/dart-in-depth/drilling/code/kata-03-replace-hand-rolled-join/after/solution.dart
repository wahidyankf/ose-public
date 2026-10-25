// Solution: the standard-library join replaces the flag-and-loop.
// => one call: join owns separators, flags, and edges together
// => empty lists join to '': the edge the hand-rolled loop had to earn
void main() {
  // => three crops join in one call: no flag, no index, no deliberation
  print(['oat', 'tea', 'rice'].join(',')); // => Output: oat,tea,rice
  // => the empty edge joins to '': bracketed so no line ends in a space
  print('empty:[${<String>[].join(',')}]'); // => Output: empty:[]
  // => custom separators ride free: the pipe sign renders the same list
  print(['oat', 'tea'].join(' | ')); // => Output: oat | tea
}
