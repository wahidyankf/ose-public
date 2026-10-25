// Example 55: Async-Await Reads Sequentially.
//
// Async functions pause at await and resume with the value, so three
// dependent fetches read as three lines instead of three nested thens.
// The function returns a Future of its body's value automatically, and
// callers await it the same way, composing async work like sync prose.
void main() async {
  // => main is async: the three fetches below read as plain sequence
  final report = await dailyReport(); // => pauses twice inside, resumes whole
  // => the composed sentence: fetched, doubled, and priced in order
  print(report); // => Output: oat: 24 sacks at 50
}

// dailyReport composes three dependent fetches into one sentence.
// => async: every await pauses here and resumes with the fetched value
// => returns Future<String>: the body returns String, async wraps the rest
Future<String> dailyReport() async {
  // => first fetch: the count the next two steps both depend on
  final sacks = await fetchCount(); // => pauses, resumes with twelve
  // => second fetch: doubles the count it just received, sequentially
  final doubled = await packDouble(sacks); // => pauses, resumes with 24
  // => third fetch: prices the doubled count the line before produced
  final price = await priceFor(doubled); // => pauses, resumes with fifty
  // => the sentence: three awaits collapse into one composed line
  return 'oat: $doubled sacks at $price'; // => async wraps into a Future
}

// fetchCount delivers twelve: the completed future behind the first await.
Future<int> fetchCount() => Future.value(12); // => instant, ordered, fixed

// packDouble doubles the count it receives: the dependent second step.
Future<int> packDouble(int sacks) => Future.value(sacks * 2); // => 24

// priceFor prices the doubled count: the dependent third step.
Future<int> priceFor(int sacks) => Future.value(sacks * 2 + 2); // => 50
