// Example 53: Records Carry Shaped Tuples.
//
// Records bundle a fixed shape of values without a class: (name, sacks)
// pairs a crop with its count, and named fields document each slot. They
// compare by value, destructure by pattern, and suit the small returns
// that deserve a shape but not a file.
void main() {
  // => stock takes the count beside the name: one record, two slots
  final oat = stock('oat', 12); // => (String, int): the positional shape
  // => $1 and $2 read the slots: position is the whole access protocol
  print('pos: ${oat.$1} ${oat.$2}'); // => Output: pos: oat 12
  // => named shape documents each slot: crop and sacks travel labeled
  final tea = priced('tea', 4, 30); // => ({...}) record with three names
  // => names read the slots: tea.crop, tea.sacks, tea.price, self-clear
  print(
      'named: ${tea.crop}=${tea.sacks}@${tea.price}'); // => Output: named: tea=4@30
  // => records compare by value: equal slots mean equal records
  print('twin: ${stock('oat', 12) == oat}'); // => Output: twin: true
  // => destructure by pattern: slots bind to locals in one declaration
  final (crop, sacks) = oat; // => pattern: shape-checked at compile time
  // => bound locals read naturally: the record unpacked into words
  print('unpacked: $crop holds $sacks'); // => Output: unpacked: oat holds 12
}

// stock pairs a crop with its count: the small return that needs a shape.
// => (String, int): positional record, two slots, no class, no file
(String, int) stock(String crop, int sacks) => (crop, sacks);

// priced adds the price beside the count: named slots stay readable.
// => named record: each slot labeled, order irrelevant at use sites
({String crop, int sacks, int price}) priced(
    String crop, int sacks, int price) {
  // => shorthand: names bind themselves, no repetition of crop: crop
  return (crop: crop, sacks: sacks, price: price); // => labeled, self-clear
}
