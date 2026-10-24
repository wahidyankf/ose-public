// Example 64: Analyze Reports No Issues.
//
// dart analyze reads the file the way the compiler's stricter sibling
// does: the shell gates this run on its clean verdict.
void main() {
  // => runs only when analyze is clean: verdict proven, then printed
  print('analyze: clean'); // => the check passed: no issues found here
  // => the rule restated beside the verdict: silence is the analyzer's praise
  print(describe()); // => the rule line: one sentence, same verdict family
}

// describe states the analyze rule this unit enforces on itself.
// => one sentence: the policy the shell command above executes
String describe() => 'no issues found, nothing to fix';
