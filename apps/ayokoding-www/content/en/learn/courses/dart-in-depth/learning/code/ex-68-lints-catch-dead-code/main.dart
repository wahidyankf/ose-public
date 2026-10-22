// Example 68: Lints Catch the Dead Branch Early.
//
// The analyzer reads what tests cannot run: a condition that is always
// true, a case that no input reaches, a variable written but never read.
// This file is the clean version: conditions that vary, cases that hit,
// and every variable read after its write. The lesson names the three
// smells beside the habits that replace them, and analyze stays silent.
void main() {
  // => the stock that varies: twelve today, honestly twelve, not constant
  final stock = {'oat': 12, 'tea': 0}; // => tea at zero: the live edge case
  // => the condition reads the value: true for oat, false for tea, alive
  final oatOk = stock['oat']! > 0; // => twelve beats zero: varies by crop
  // => the branch depends on data: no dead arm, both outcomes reachable
  print('oat stocked: $oatOk'); // => Output: oat stocked: true
  print('tea stocked: ${stock['tea']! > 0}'); // => Output: tea stocked: false
  // => every variable read: stock read twice above, oatOk read once here
  final report = 'oat:$oatOk'; // => report built from reads, not wishes
  // => the report prints: written and read, the lint's favorite shape
  print('report: $report'); // => Output: report: oat:true
  // => combined verdict: oat stocked and tea bare, both honestly reported
  final bothHonest = oatOk && stock['tea']! == 0; // => true and true: honest
  // => the combined line: one boolean summarizing the honest pair
  print('both honest: $bothHonest'); // => Output: both honest: true
}
