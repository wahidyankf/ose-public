// Starter: lookup returns string with no null story. The gap: callers guess.
// => annotate with string? and guard at the call site following Example 62
string Find(string dish) // => no ? : the signature hides the missing case
{
    return dish == "rendang" ? dish : null!; // => BUG: null! lies to the compiler
}
Console.WriteLine(Find("rendang")); // => prints today, explodes on "sushi".Length
