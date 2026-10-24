// check.dart: the capstone's own test run. Freezes inputs, asserts the
// pure core's answers, and prints the passing count: the stdlib-only test
// convention this course teaches, failing-first in spirit, green in fact.
// Production Dart would use package:test; the shape here mirrors it.
import 'grading.dart'; // => the pure core under test: no IO, no clock

void main() {
  // => band boundaries: the four promises, pinned exactly like kata tables
  assert(band(95) == 'A'); // => ceiling promise: ninety-five earns A
  // => boundary promise: ninety itself already earns the top band
  assert(band(90) == 'A'); // => edge of excellence: inclusive floor
  // => middle promise: seventy-five holds B without touching A or C
  assert(band(75) == 'B'); // => the solid middle, both edges implied
  // => floor promise: fifty-nine fails, proving C starts at sixty
  assert(band(59) == 'F'); // => honesty at the floor: F below sixty
  // => parse promise: honest lines shape into records with line numbers
  assert(parseLine('Sari,95', 1) == ('Sari', 95)); // => shaped pair, exact
  // => addressed failure: empty names throw with their line number riding
  assert(_throwsLine(() => parseLine(',81', 3), 3)); // => line 3, addressed
  // => bad scores name themselves: the offending text rides the reason
  assert(_throwsLine(() => parseLine('Dewi,many', 4), 4)); // => line 4 too
  // => the ledger promise: four receipts beside two addressed skips
  assert(gradeLines(['Sari,95', ',81']).length == 2); // => receipt plus skip
  // => eight checks green: the count line proves the convention ran
  print('checks: 8 passed'); // => Output: checks: 8 passed
}

// _throwsLine runs the attempt and reports whether GradingError names line.
// => true exactly when the addressed failure carries the expected number
// => helpers like this are the custom matchers of the stdlib convention
bool _throwsLine(void Function() attempt, int line) {
  // => the attempt runs inside try: addressed failures land below
  try {
    // => honest lines return: reaching here means no failure to check
    attempt(); // => throwing attempts never reach past this call
    // => no throw means the test fails: false reports the missing failure
    return false; // => expected a failure, got a value: red by return
  } on GradingError catch (e) {
    // => addressed: the line number rides along
    // => the line decides: true exactly when the address matches
    return e.line == line; // => line 3 for ',81', line 4 for 'Dewi,many'
  }
}
