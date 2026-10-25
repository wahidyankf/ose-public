// Solution: quantity parsed with int.TryParse. Bad input prints, never throws.
// => Try-pattern from Example 10: false means expected failure, handled inline
string[] orders = { "12", "abc", "30" }; // => two good quantities, one typo
foreach (string raw in orders) // => the same loop shape, now crash-free
{
    // => TryParse answers true plus the value, or false with value zero
    if (int.TryParse(raw, out int qty)) // => qty receives 12, then 30
    {
        Console.WriteLine($"serving {qty}"); // => Output: serving 12, then serving 30
    }
    else // => false means bad input: an expected failure, not an exception
    {
        Console.WriteLine($"bad order: {raw}"); // => Output: bad order: abc
    }
}
