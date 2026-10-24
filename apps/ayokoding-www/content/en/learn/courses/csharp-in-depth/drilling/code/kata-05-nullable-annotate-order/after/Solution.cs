// Solution: string? plus a guard. Missing dishes are honest, never explosive.
// => nullable idiom from Example 62: the ? carries the missing case openly
string? Find(string dish) // => string? admits null: the lookup may miss
{
    return dish == "rendang" ? dish : null; // => honest null, honestly typed
}

// => the guard below is load-bearing: dereference only after the null check
string? maybe = Find("sushi"); // => null: the missing dish, typed as missing
Console.WriteLine($"missing: {maybe is null}"); // => Output: missing: True
Console.WriteLine($"found: {Find("rendang")!.Length} letters"); // => Output: found: 7 letters
