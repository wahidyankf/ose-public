// Starter: validation by throw. The bug: negatives crash the caller.
// => throw on negative: callers cannot recover without a catch boundary
// => rewrite: return Result<int> like Example 14, Success or Failure
void main() {
  // => valid input works: the bug hides until the negative arrives
  print(check(12)); // => prints, then the next call explodes below
  // => BUG: negative input throws: no value to check, only a catch
  print(check(-4)); // => throws: crash path, not a contract
}

// check throws on negatives: the throw-as-validation anti-pattern.
// => BUG: caller input reaches throw: a crash path, not a contract
int check(int sacks) {
  // => negative input throws: the exact shape Example 14 replaces
  if (sacks < 0) throw Exception('negative sacks'); // => BUG: catch or crash
  // => valid input returns: the only path that survives the throw above
  return sacks; // => surviving path: the shape every call should share
}
