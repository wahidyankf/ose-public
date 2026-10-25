// => Example 68: Flat Beats Nested.
// => Guards plus a switch expression replace three nesting levels with one.
// => the nested version below is what the flat rewrite underneath retires
Console.WriteLine(Nested("rendang", 2)); // => Output: 50000
Console.WriteLine(Flat("rendang", 2)); // => Output: 50000

// => nested: every condition indents the answer one level deeper
// => the pyramid taxes readers: each level holds conditions in mind at once
int Nested(string dish, int qty) // => the shape to retire: pyramid of doom
{
    // => level one decides quantity: everything below indents under it
    if (qty > 0) // => level one: quantity must be positive
    {
        // => level two decides the dish: the answer sinks another level
        if (dish == "rendang") // => level two: dish must match
        {
            return 25000 * qty; // => answer hides two levels deep
        }
    }
    // => the failure value sits far from the conditions that chose it
    return 0; // => failure value far from the conditions that chose it
}

// => flat: guards exit early, the switch answers at the margin
// => same answers, new shape: the rewrite below changes structure only
int Flat(string dish, int qty) // => the idiomatic rewrite: same answers
{
    // => guard first: bad quantity exits before any dish logic runs
    // => inverted conditions exit: failures return instead of nesting
    if (qty <= 0) // => inverted condition: failure returns immediately
    {
        return 0; // => early exit keeps the rest flat
    }
    return dish switch // => one expression answers at the left margin
    {
        "rendang" => 25000 * qty, // => the only dish this kitchen prices
        _ => 0, // => unknown dishes still total zero, flatly
    };
}
