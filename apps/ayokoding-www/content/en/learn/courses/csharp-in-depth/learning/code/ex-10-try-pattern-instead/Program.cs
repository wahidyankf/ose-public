// => Example 10: Try Pattern Instead.
// => Expected failures return false: int.TryParse never throws for bad input.
string[] orders = { "12", "abc", "30" }; // => two good quantities, one typo

// => the same loop shape handles success and failure without any catch
// => typos are routine input, so branching beats throwing on cost alone
foreach (string raw in orders) // => each raw order faces the same question
{
    // => TryParse answers true plus the value, or false with value zero
    // => out declares qty inline: the value lives exactly where it is needed
    if (int.TryParse(raw, out int qty)) // => qty receives 12, then 30
    {
        Console.WriteLine($"serving {qty}"); // => Output: serving 12, then serving 30
    }
    else // => false means bad input: an expected failure, not an exception
    {
        Console.WriteLine($"bad order: {raw}"); // => Output: bad order: abc
    }
}
