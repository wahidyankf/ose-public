// Example 54: Futures Are Values for Later.
//
// A Future is a value that has not arrived yet: .then stages the next
// step, .catchError stages the recovery, and the chain reads top to
// bottom while running inside-out. Already-completed futures keep every
// run ordered and instant, which is why this survey never waits on a
// clock, a socket, or a timer.
void main() async {
  // => main is async: awaits sequence the two roads in transcript order
  // => the ledger as a later-value: completed before the chain is built
  final stock = Future.value(12); // => already done: ordering stays fixed
  // => then stages the doubling: runs when the twelve arrives, in order
  final doubled =
      await stock.then((sacks) => sacks * 2); // => 24, awaited first
  print('oat: $doubled sacks'); // => Output: oat: 24 sacks
  // => the failure road: a completed error carries the miss instead
  final missing = Future<int>.error(Exception('salt unstocked'));
  // => catchError stages the recovery: the miss becomes a value again
  final answered = await missing.catchError((e) => -1); // => -1 marks it
  // => recovered values rejoin the road: printed second, in fixed order
  print('salt: $answered'); // => Output: salt: -1
  // => both roads settle into one ledger: stocked plus recovered combined
  final combined = doubled + answered; // => 24 plus -1: the miss debits
  // => the combined count: the day's honest total across both roads
  print('ledger: $combined'); // => Output: ledger: 23
}
