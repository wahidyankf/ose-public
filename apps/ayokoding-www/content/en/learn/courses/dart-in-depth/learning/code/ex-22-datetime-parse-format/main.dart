// Example 22: DateTime Parses, Converts, and Formats on Purpose.
//
// DateTime.parse reads ISO 8601 text, toUtc pins the instant to UTC, and
// difference measures between instants, so scheduling math never depends
// on the machine's local zone. Display formats build by hand from parts,
// keeping the stored instant and its rendering strictly separate.
void main() {
  // => harvest day written as ISO text: the portable instant notation
  final harvest = DateTime.parse('2026-03-14 06:00:00'); // => local zone here
  // => toUtc pins the same instant to UTC: one zone for all stored times
  final stored = harvest.toUtc(); // => the canonical stored form
  // => isUtc proves the pin: scheduling code asserts this, never assumes
  print('utc: ${stored.isUtc}'); // => Output: utc: true
  // => parts render by hand: year, month, day from the stored instant
  final stamp = '${stored.year}-${_two(stored.month)}-${_two(stored.day)}';
  // => zero-padded parts: March renders 03, keeping stamps sortable
  print('stamp: $stamp'); // => Output: stamp: 2026-03-14
  // => the market opens eight hours after harvest, same morning
  final market = stored.add(const Duration(hours: 8)); // => const duration
  // => difference measures the gap: an honest Duration, not eyeballed math
  final gap = market.difference(stored); // => exactly the eight hours added
  // => inHours reads the Duration whole: no division, no rounding slip
  print('gap hours: ${gap.inHours}'); // => Output: gap hours: 8
  // => isBefore compares instants: harvest precedes market, as planned
  print(
      'harvest first: ${stored.isBefore(market)}'); // => Output: harvest first: true
}

// _two pads a date part to two digits for sortable stamps.
// => padLeft is the stdlib idiom: width two, fill zero, once per part
// => tiny helper, big payoff: unpadded stamps sort wrong ('3' beats '14')
String _two(int part) => part.toString().padLeft(2, '0');
