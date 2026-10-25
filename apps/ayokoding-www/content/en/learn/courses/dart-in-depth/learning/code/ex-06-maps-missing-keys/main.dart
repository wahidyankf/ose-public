// Example 6: Maps Distinguish Missing Keys from Stored Values.
//
// A Map lookup returns null both for a missing key and for a key mapped
// to null, so containsKey asks the sharper question. Update and
// putIfAbsent change entries in place without a lookup-then-set dance.
void main() {
  // => stock keyed by name: the map is the pantry ledger
  final stock = {'oat': 12, 'tea': 4}; // => two entries: name to sacks
  // => containsKey asks presence: the question a null lookup cannot answer
  print('has oat: ${stock.containsKey('oat')}'); // => Output: has oat: true
  // => missing key: containsKey says false instead of guessing from null
  print('has salt: ${stock.containsKey('salt')}'); // => Output: has salt: false
  // => update rewrites an entry in place: current value in, new value out
  stock.update('tea', (sacks) => sacks + 6); // => tea goes from 4 to 10
  // => putIfAbsent adds only when missing: existing entries are untouched
  stock.putIfAbsent('tea', () => 99); // => tea exists: the 99 is ignored
  // => putIfAbsent on a new key: the closure supplies the first stock
  stock.putIfAbsent('salt', () => 2); // => salt arrives with 2 sacks
  // => entries print in insertion order: oat, tea, then salt
  print('stock: $stock'); // => Output: stock: {oat: 12, tea: 10, salt: 2}
  // => keys and values views: iterate names or sacks without the pairs
  final names = stock.keys.join(','); // => join folds the names with commas
  // => one line of names: the order the entries were inserted in
  print('names: $names'); // => Output: names: oat,tea,salt
}
