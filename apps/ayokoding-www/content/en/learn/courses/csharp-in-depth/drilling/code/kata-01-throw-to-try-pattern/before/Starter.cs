// Starter: quantity parsed with int.Parse. The bug: bad input throws.
// => rewrite with int.TryParse following Example 10, printing bad lines plainly
string[] orders = { "12", "abc", "30" }; // => two good quantities, one typo
foreach (string raw in orders) // => the loop the rewrite keeps, crash-free
{
    Console.WriteLine($"serving {int.Parse(raw)}"); // => BUG: abc throws FormatException here
}
