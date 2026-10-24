// Example 66: Every Public Member Carries Its Doc.
//
// A public member without a doc comment is a guess waiting to happen:
// dart doc skips it and hover shows a bare signature. This example gives
// the whole tiny depot API its /// lines, then prints the member list
// the docs promise, proving docs and surface agree line for line.
void main() {
  // => the documented depot in use: every call below has a /// upstairs
  const depot = Depot('north', 100); // => const: the depot facts are fixed
  // => receive adds stock: the doc promises the new total, code returns it
  print(depot.receive(20)); // => Output: north depot holds 120 sacks
  // => release removes stock: the doc promises the remainder sentence
  print(depot.release(30)); // => Output: north depot released 30, keeps 90
}

/// A storage depot that receives and releases sacks by count.
///
/// The depot never goes negative: [receive] grows it, [release] refuses
/// the impossible with a sentence instead of a throw.
class Depot {
  /// The depot site, shown in every sentence it reports.
  final String site;

  /// The sacks currently stored: starts at [capacity], moves by calls.
  final int stored;

  /// Builds a depot at [site] holding [stored] sacks to start.
  const Depot(this.site, this.stored);

  /// Adds [sacks] to storage and reports the new total sentence.
  String receive(int sacks) => '$site depot holds ${stored + sacks} sacks';

  /// Releases [sacks] when stock covers them, else refuses in words.
  String release(int sacks) {
    // => coverage check first: refusals read as sentences, never throws
    if (sacks > stored) return '$site depot short: keeps $stored';
    // => covered releases subtract: the remainder sentence tells the rest
    return '$site depot released $sacks, keeps ${stored - sacks}';
  }
}
