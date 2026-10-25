// Example 12: Finally Always Runs.
//
// Finally runs whether the try succeeds, throws, or returns early, so it
// owns the cleanup nobody may skip. Resources close in finally; answers
// return from try and catch, never from finally itself.
void main() {
  // => two harvests: one clean, one interrupted mid-way
  print(harvest(['oat', 'tea'])); // => Output: closed:2 kept:2
  // => the bad sack throws, yet the ledger still closes exactly once
  print(harvest(['oat', 'rot', 'tea'])); // => Output: closed:1 kept:1
}

// harvest keeps the good sacks and always closes the ledger.
// => the count of kept sacks is the answer; closing is the duty
// => return lives in try and catch: finally only cleans, never answers
String harvest(List<String> sacks) {
  // => kept counts the sacks that survived inspection
  var kept = 0; // => starts at zero: nothing inspected yet
  // => closed proves finally ran: the test the example asserts by printing
  var closed = 0; // => starts at zero: the ledger is still open
  // => the risky pass over user-controlled sacks
  try {
    // => inspect each sack in order: rot ruins the pass
    for (final sack in sacks) {
      // => for-in: every sack gets inspected
      // => rot is the failure condition: the pass ends here
      if (sack == 'rot') {
        // => spoiled sack: nothing after it is trusted
        throw StateError('spoiled sack'); // => abort the pass, not the cleanup
      }
      kept++; // => good sack: counted before the next inspection
    }
    // => clean pass: kept holds every sack, closed still zero until finally
    return 'closed:$closed kept:$kept'; // => closed fills in below first
  } catch (_) {
    // => the spoiled pass lands here with kept partial
    // => partial answer: kept holds only the sacks before the rot
    return 'closed:$closed kept:$kept'; // => closed fills in below first
  } finally {
    // => runs on both paths above: the unskippable duty
    // => exactly one close per call: success and failure alike
    closed++; // => the ledger closes: proven by the printed count
  }
}
