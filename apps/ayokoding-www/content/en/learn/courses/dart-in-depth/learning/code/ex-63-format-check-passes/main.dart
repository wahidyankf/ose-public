// Example 63: Format Check Passes on Formatted Code.
//
// dart format --set-exit-if-changed exits zero exactly when the file is
// already formatted: the shell gates this run on the verdict.
void main() {
  // => runs only when the format check passed: verdict proven, then printed
  print('formatted: true'); // => the check passed: this file is canonical
  // => the rule restated beside the verdict: tools own layout, reviewers logic
  print(describe()); // => the rule line: one sentence, same verdict family
}

// describe states the format rule this unit enforces on itself.
// => one sentence: the policy the shell command above executes
String describe() => 'layout by tool, logic by reviewer';
