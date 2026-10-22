// Starter: mutable order. The bug: repricing destroys the old price.
// => var fields: every method below can rewrite history by accident
// => rewrite: final fields plus copyWith like Examples 49 and 50
void main() {
  // => the order opens at thirty: the history the reprice will destroy
  final order = Order('oat', 12, 30); // => mutable: price about to move
  // => reprice mutates: the thirty is gone, no version keeps it
  order.reprice(25); // => history destroyed: thirty lives nowhere now
  // => prints twenty-five: correct now, unprovable against before
  print(order.price); // => 25: the after without a before beside it
}

// Order holds a purchase line: mutable, history-destroying, convenient.
// => BUG: var price: reprice below rewrites what happened, not what is
class Order {
  // => var crop: mutable identity, reassignable by any method, anytime
  var crop = ''; // => BUG: identity should freeze, like Example 49
  // => var sacks: mutable count, drifting under every future edit
  var sacks = 0; // => BUG: counts should freeze at writing time
  // => var price: the history-destroyer, repriced without a trace
  var price = 0; // => BUG: derivation should keep every version
  // => constructor assigns: the only honest lines in a mutable class
  Order(this.crop, this.sacks, this.price); // => fields set, then exposed
  // => reprice mutates: the old price vanishes with no version kept
  void reprice(int next) => price = next; // => BUG: derivation over mutation
}
