// Starter: freight billing with no tests. The bug: nothing pins the rule.
// => untested arithmetic: the next edit can silently rebill every wagon
// => rewrite: table-test freightTotal like Examples 39 and 41 demand
void main() {
  // => the bill prints: correct today, unproven tomorrow, fragile forever
  print(freightTotal([10, 20], 3)); // => 90: trusted, never checked
}

// freightTotal bills wagons times rate: pure, correct, and untested.
// => BUG: no test pins it: any edit below ships on hope, not proof
int freightTotal(List<int> wagons, int rate) {
  // => fold sums the loads: the whole billing rule in two lines
  final sacks = wagons.fold(0, (sum, w) => sum + w); // => 30 for the demo
  // => rate multiplies: correct, and completely unguarded by any test
  return sacks * rate; // => 90: right until someone changes the fold
}
