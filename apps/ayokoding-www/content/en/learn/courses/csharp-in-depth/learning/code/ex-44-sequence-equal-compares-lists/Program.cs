// => Example 44: Sequence Equal Compares Lists.
// => SequenceEqual compares order plus items: same items shuffled still fail.
var got = new List<string> { "rice", "rendang", "sambal" }; // => the order the code produced
var want = new List<string> { "rice", "rendang", "sambal" }; // => the promised ticket order

// => SequenceEqual walks both lists pairwise: length plus every position
Console.WriteLine(got.SequenceEqual(want) ? "PASS: ticket order matches" : "FAIL: order drifted"); // => Output: PASS

// => shuffled input proves the comparison is order-sensitive, not bag-like
var shuffled = new List<string> { "rendang", "rice", "sambal" }; // => same items, wrong order
Console.WriteLine(shuffled.SequenceEqual(want) ? "PASS" : "FAIL: shuffled is not equal"); // => Output: FAIL
