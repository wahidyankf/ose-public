// => Example 20: Regex Finds Patterns.
// => Regex.Matches scans fixed text and reports every hit with its position.
var line = "order 12 rice, order 30 rendang"; // => fixed input: two orders hide here

// => the pattern names its capture: count holds the digits for each order
var matches = System.Text.RegularExpressions.Regex.Matches(
    line,
    @"order (?<count>\d+) (?<dish>\w+)"
); // => verbatim string: backslashes stay literal

// => Count reports the hits: exactly the two orders above
Console.WriteLine($"orders: {matches.Count}"); // => Output: orders: 2

// => named groups read like fields: count plus dish per hit, in order
foreach (System.Text.RegularExpressions.Match m in matches) // => Matches returns in scan order
{
    Console.WriteLine($"{m.Groups["dish"].Value} x{m.Groups["count"].Value}"); // => Output: rice x12, then rendang x30
}
