// Solution: frozen fields with copyWith derivation keep every version.
// => final fields: construction sets them, nothing moves them after
// => copyWith derives: repricing returns the next version, keeps this one
void main() {
  // => the order opens at thirty: frozen, versioned, keeps forever
  const order = Order('oat', 12, 30); // => const: the starting fact
  // => reprice derives: thirty stays in order, twenty-five in repriced
  final repriced = order.copyWith(price: 25); // => new version, old intact
  // => both versions print: before beside after, history preserved
  print('${order.price} then ${repriced.price}'); // => Output: 30 then 25
}

// Order is one frozen purchase line: changes derive, never mutate.
// => all fields final: copyWith is the only evolution path, by design
class Order {
  // => final facts: crop, count, price, frozen at construction time
  final String crop; // => what is bought: never changes for this line
  final int sacks; // => how many: fixed when the line is written
  final int price; // => at what price: repriced by derivation, not edit
  // => const constructor: order lines start as compile-time facts
  const Order(this.crop, this.sacks, this.price); // => frozen at birth
  // => copyWith derives: null keeps mine, values take the replacement
  Order copyWith({String? crop, int? sacks, int? price}) {
    // => each field keeps its own unless the caller names a replacement
    return Order(
        crop ?? this.crop,
        sacks ?? this.sacks, // => crop, sacks
        price ?? this.price); // => price: the derived version's news
  }
}
