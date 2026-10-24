// => Example 62: Nullable Flags Missing Nulls.
// => Nullable enable makes string? honest: the compiler rejects silent nulls.
string? maybe = Find("rendang"); // => string? admits null: the lookup may miss

// => the null check below is load-bearing: remove it and the build warns
if (maybe is not null) // => is not null: the only dereference the compiler trusts
{
    Console.WriteLine($"found: {maybe.Length} letters"); // => Output: found: 7 letters
}

// => missing dishes return null: the caller above must ask before touching
string? missing = Find("sushi"); // => null: honestly typed, honestly handled
Console.WriteLine($"missing: {missing is null}"); // => Output: missing: True

// => Find returns null for unknown dishes: the ? in the signature promises it
string? Find(string dish) // => local function: dish in, dish or null out
{
    // => expression body with a switch: known dishes answer, the rest miss
    return dish switch // => the menu lives in this one expression
    {
        "rendang" => dish, // => known: the dish itself answers
        "rice" => dish, // => known: the dish itself answers
        _ => null, // => unknown: null, and the signature says so
    };
}
