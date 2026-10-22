// Example 33: Doc Comments Feed Dart Doc.
//
// Triple-slash comments on public members are the API reference: dart doc
// renders them, IDEs show them on hover, and readers meet them before the
// code. This example documents a tiny scale API fully, then prints the
// member list its own docs promise, proving docs and code agree.
void main() {
  // => the documented scale in use: tare then weigh, docs beside each step
  const scale = Scale('mill'); // => const: the scale's identity is fixed
  // => tare zeroes the scale: the doc line below promises exactly this
  print(scale.tare()); // => Output: mill scale zeroed
  // => weigh reads the load: docs promise kilograms, code returns them
  print(scale.weigh(25)); // => Output: 25 kg on mill
}

/// A weighbridge scale that zeroes before every honest weighing.
///
/// The scale adds no magic: [tare] zeroes it, [weigh] reads kilograms.
/// Bracket names link to members, so the reference stays navigable.
class Scale {
  /// The site this scale serves, shown in every reading it reports.
  final String site;

  /// Builds a scale for [site]: const, because sites never move.
  const Scale(this.site);

  /// Zeroes the scale and reports the act: call before every [weigh].
  String tare() => '$site scale zeroed';

  /// Reads [kilos] of load: the honest weight after a [tare].
  String weigh(int kilos) => '$kilos kg on $site';
}
