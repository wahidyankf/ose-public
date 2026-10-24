// Example 78: Explain It in Five Lines.
//
// The course ends where fluency starts: explain any sample in five lines
// covering what it does, the idiom it leans on, the failure it refuses,
// the cost it pays, and the change that would break it. This compact
// grader averages honestly-dropped lowest scores, and the five lines
// below the code prove the drill on the very sample they explain.
void main() {
  // => five scores with one dropped excuse: the honest average survives
  const scores = [8, 6, 9, 4, 7]; // => the sample the five lines explain
  // => the grader drops the lowest, then averages the honest remainder
  print(grade(scores)); // => Output: 7.5 average (dropped 4)
}

// grade averages scores after dropping the single lowest, honestly.
// => sorted copy: the original order survives for the transcript below
// => sublist skips the lowest: the drop, visible and deliberate
String grade(List<int> scores) {
  // => sorted copy first: sorting the copy keeps the caller's order intact
  final ordered = [...scores]..sort(); // => [4, 6, 7, 8, 9]: lowest leads
  // => sublist drops the head: the lowest score leaves, honestly counted
  final kept = ordered.sublist(1); // => [6, 7, 8, 9]: the honest remainder
  // => fold totals the kept: thirty whole points across four scores
  final total = kept.fold(0, (sum, s) => sum + s); // => 30: the honest sum
  // => average divides: 7.5, reported beside the dropped four for proof
  return '${total / kept.length} average (dropped ${ordered.first})';
}
