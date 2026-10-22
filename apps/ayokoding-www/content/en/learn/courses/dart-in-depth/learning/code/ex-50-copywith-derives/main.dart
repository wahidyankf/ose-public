// Example 50: CopyWith Derives New Values from Old.
//
// Immutable objects change by derivation: copyWith takes the old value
// plus the fields that differ and returns a new object, leaving the
// original untouched. Every state transition becomes a visible call with
// named arguments, and history stays available because nothing mutates.
void main() {
  // => the morning order: twelve oat sacks, full price, undelivered
  const order = Order('oat', 12, 30, false); // => const: the starting fact
  // => noon update: same order, price cut to twenty-five, rest identical
  final noon = order.copyWith(price: 25); // => new object: old one intact
  // => the original keeps thirty: derivation never rewrites history
  print(
      'was: ${order.price}, now: ${noon.price}'); // => Output: was: 30, now: 25
  // => evening update: delivered flag flips on the noon version
  final done = noon.copyWith(delivered: true); // => chains: noon stays too
  // => the chain proves immutability: three versions, one lineage
  print(
      'lineage: ${order.delivered} ${noon.delivered} ${done.delivered}'); // => Output: lineage: false false true
}

// Order is one immutable purchase line: changes derive, never mutate.
// => all fields final: the only evolution path is copyWith derivation
// => named optional parameters: callers name exactly what differs
class Order {
  // => final facts: crop, count, price, and delivery state, all frozen
  final String crop; // => what is bought: never changes for this line
  final int sacks; // => how many: fixed when the line is written
  final int price; // => at what price: repriced by derivation, not edit
  final bool delivered; // => delivered yet: flips once, by derivation
  // => const constructor: order lines start as compile-time facts
  const Order(this.crop, this.sacks, this.price, this.delivered);
  // => copyWith derives: null means 'keep mine', values mean 'take this'
  Order copyWith({String? crop, int? sacks, int? price, bool? delivered}) {
    // => each field keeps its own unless the caller names a replacement
    return Order(
        crop ?? this.crop,
        sacks ?? this.sacks, // => crop, sacks
        price ?? this.price,
        delivered ?? this.delivered); // => price, flag
  }
}
