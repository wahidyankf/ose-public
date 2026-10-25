// Example 75: Name the Retry Pattern Before Reading It.
//
// Retry with a cap reads as 'try, catch, count, repeat until attempts run
// out': naming the pattern first turns twenty lines into one recognized
// shape. This loader retries a flaky read up to three times with no
// sleeping between attempts, keeping the survey deterministic, and the
// transcript proves attempt one fails while attempt two succeeds.
void main() async {
  // => the flaky read fails once, then succeeds: attempts tell the story
  final reader = FlakyReader(1); // => fails one time, then delivers twelve
  // => load retries up to three: the named pattern, executed below
  final sacks = await load(reader, 3); // => attempt one fails, two lands
  // => twelve arrives on the second attempt: the pattern earned its keep
  print('loaded: $sacks'); // => Output: loaded: 12
  // => attempts spent: two of three, the third never needed, cap unhit
  print('attempts: ${reader.tries}'); // => Output: attempts: 2
}

// load retries the read until it lands or the cap runs out, no sleeping.
// => the retry shape: try, catch, count, repeat while attempts remain
// => throws the last failure when the cap runs out: honest about defeat
Future<int> load(FlakyReader reader, int cap) async {
  // => failures collect here: the last one throws if the cap runs out
  late Exception last; // => late: assigned on the first failure, read later
  // => attempt counter: one-based, so the transcript reads naturally
  for (var attempt = 1; attempt <= cap; attempt++) {
    // => at most cap tries
    // => each attempt tries the read: success returns from inside the try
    try {
      // => the read either delivers or throws: the flaky shape, honestly
      return await reader.read(); // => success exits with the value
    } catch (e) {
      // => failures land here: counted, then either retried
      // => remember the failure: the cap-out throw reports the last one
      last = e as Exception; // => the failure to throw if attempts run out
      // => cap reached means defeat: throw the last failure, stop retrying
      if (attempt == cap) throw last; // => cap-out: honest about defeat
      // => otherwise loop: the next attempt runs without sleeping here
    }
  }
  // => unreachable: the loop returns or throws on every path above
  throw last; // => the compiler needs an exit: this line never executes
}

// FlakyReader fails a fixed number of times, then delivers twelve.
// => deterministic flakiness: fails-a-count, never random, never timed
// => tries counts attempts: the transcript proves the pattern's path
class FlakyReader {
  // => failures remaining: decremented per attempt until delivery begins
  int _failuresLeft; // => private: the flakiness dial, set at construction
  // => tries counts every attempt: success and failure alike, for proof
  int tries = 0; // => public: the transcript reads the pattern's path
  // => construction sets the dial: one failure, then honest delivery
  FlakyReader(this._failuresLeft); // => the flakiness is a parameter
  // => read fails while the dial lasts, then delivers twelve forever
  Future<int> read() async {
    // => every call is an attempt: counted before anything else happens
    tries++; // => the pattern's path, numbered for the transcript
    // => dial still set: fail this attempt, decrement toward delivery
    if (_failuresLeft > 0) {
      // => attempt one lands here with dial at one
      // => decrement first: the next attempt sees a smaller dial
      _failuresLeft--; // => dial to zero: attempt two will deliver
      // => the failure: an ordinary exception the retry loop catches
      throw Exception('scale busy'); // => attempt one ends here, caught
    }
    // => dial spent: deliver twelve, the honest reading at last
    return 12; // => attempt two lands here: the pattern succeeded
  }
}
