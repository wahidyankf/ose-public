// Example 1: Hello with an Early Return.
//
// Dart checks the failure first and returns it, so the happy path stays
// at the left margin instead of nesting inside an if block.
void main() {
  // => one call shape for both inputs: print whatever greet returns
  print(greet('')); // => Output: error: name is empty
  // => same call shape, valid input: the greeting prints instead
  print(greet('Sari')); // => Output: hello, Sari
}

// greet refuses an empty name before it ever builds a greeting.
// => the return type is honest: a String comes back on every path
// => failures travel as ordinary values, not as thrown exceptions
String greet(String name) {
  // => guard clause first: the failure case is decided up front
  if (name.isEmpty) {
    // => the one input this function cannot serve
    // => leave immediately: no greeting is built for an empty name
    return 'error: name is empty'; // => failure value, same type as success
  }
  // => past the guard, the name is safe to use without further checks
  return 'hello, $name'; // => string interpolation reads the value inline
}
