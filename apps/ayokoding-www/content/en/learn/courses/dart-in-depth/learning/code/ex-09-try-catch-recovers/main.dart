// Example 9: Try-Catch Recovers at the Boundary.
//
// Parsing user text can fail, and try-catch turns that failure into an
// answer instead of a crash. The catch names the failure and the code
// after the block runs either way, recovered or clean.
void main() {
  // => two inputs: one honest number, one hopeless word
  print(parseAge('27')); // => Output: age 27: adult band
  // => the failure path: catch converts the throw into a sentence
  print(parseAge('old')); // => Output: age unknown: no band assigned
}

// parseAge reads an age band from text that may not be a number.
// => String in, String out: the failure never escapes as an exception
// => callers get an answer on every path, valid or not
String parseAge(String text) {
  // => try the risky step: parsing text the user typed
  try {
    // => int.parse throws FormatException on non-numeric text
    final age = int.parse(text); // => 27 parses; 'old' throws here
    // => past the parse, the number is safe to classify
    return age >= 18 ? 'age $age: adult band' : 'age $age: minor band';
    // => catch the specific failure: FormatException from a bad parse
  } on FormatException {
    // => no binding: the answer needs no failure fields
    // => recover with words: the unknown answer replaces the missing band
    return 'age unknown: no band assigned';
  }
}
