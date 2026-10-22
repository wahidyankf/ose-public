// => Example 41: Fake Console Captures Output.
// => StringWriter stands in for the console: write to the fake, assert the text.
var fake = new System.IO.StringWriter(); // => the fake console: captures every line

// => the code under check writes to any TextWriter, console or fake alike
fake.WriteLine("rice x2"); // => production call shape, pointed at the fake
fake.WriteLine("rendang x1"); // => second line lands in the same buffer

// => ToString freezes the buffer: the transcript below is the assertion input
string got = fake.ToString().Replace("\r\n", "\n"); // => normalize newlines: stable on every OS
string want = "rice x2\nrendang x1\n"; // => the promised ticket text, newline-exact

// => the comparison prints both sides only when the fake disagrees
Console.WriteLine(got == want ? "PASS: ticket text matches" : $"FAIL: got {got}"); // => Output: PASS
