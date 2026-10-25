// Example 67: Prefer Const Where the Value Allows.
//
// Const builds the value once at compile time instead of on every run,
// and the prefer_const_constructors lint points at every spot the code
// missed. This example builds its mill, quota, and ledger lines const,
// then prints the three facts the lint would otherwise flag line by line.
void main() {
  // => const mill facts: site and capacity fixed before the run starts
  const site = 'east'; // => the mill site: a compile-time fact, not data
  // => const quota: policy belongs in the binary, not in a variable
  const quota = 50; // => fifty sacks: the rule every delivery meets
  // => const ledger lines: equal builds share canonical objects (ex 48)
  const first = ['oat', 12]; // => const list: name beside count, one build
  // => the site and quota print first: policy facts, compiled in already
  print('site: $site, quota: $quota'); // => Output: site: east, quota: 50
  // => first holds the const pair: canonical, shared, printed whole
  print('first: $first'); // => Output: first: [oat, 12]
  // => const map of caps per crop: policy table, compiled in, never copied
  const caps = {'oat': 50, 'tea': 40}; // => caps: the quota book, constant
  // => lookups read the compiled table: no allocation per delivery check
  print('oat cap: ${caps['oat']}'); // => Output: oat cap: 50
}
