// Example 10: Catch the Specific Failure First.
//
// On-catch clauses are tried top down, so the narrow failure goes first
// and the broad Exception lands last. A specific catch can use the
// failure's own fields; the broad one only gets the message.
void main() {
  // => four inputs: a bad number, an empty string, a mystery, a good one
  print(handle('abc')); // => Output: bad number: not digits
  // => empty input trips the StateError arm, not the FormatException one
  print(handle('')); // => Output: empty input: nothing to parse
  // => the mystery skips both narrow arms and lands in the broad net
  print(handle('!!')); // => Output: unexpected: Exception: boom
  // => valid input never throws: the success answer proves the shape
  print(handle('10')); // => Output: parsed 10
}

// handle sorts three different failures into three different answers.
// => the order is the logic: narrow arms first, broad safety net last
// => every arm returns: no failure falls off the end unanswered
String handle(String text) {
  // => the risky block can raise any of the three failures below
  try {
    // => empty text is a state problem, not a format problem
    if (text.isEmpty) {
      // => nothing to parse: a different kind of wrong
      throw StateError(
          'nothing to parse'); // => StateError, not FormatException
    }
    // => the mystery input fails in a way no narrow arm names
    if (text == '!!') {
      // => an unexpected failure, raised on purpose
      throw Exception('boom'); // => plain Exception: only the net fits
    }
    // => ordinary text parses, or throws FormatException on bad digits
    final n = int.parse(text); // => 'abc' throws here, '10' sails through
    // => success answer: proves the try block is not failure-only
    return 'parsed $n'; // => '10' lands here with n bound to ten
    // => narrowest arm first: FormatException from a bad digit string
  } on FormatException {
    // => no binding: the answer needs no fields
    // => 'abc' lands here: the format answer, not the state one
    return 'bad number: not digits';
    // => StateError arm second: matches the empty-input throw exactly
  } on StateError {
    // => no binding needed: the answer needs no fields
    // => empty input lands here: the state answer, not the format one
    return 'empty input: nothing to parse';
    // => broad net last: the mystery Exception still gets an answer
  } on Exception catch (e) {
    // => e carries the 'boom' message upward
    // => safety net: prints the whole exception so the log stays useful
    return 'unexpected: $e';
  }
}
