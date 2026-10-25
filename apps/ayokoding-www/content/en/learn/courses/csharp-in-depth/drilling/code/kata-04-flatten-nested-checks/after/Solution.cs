// Solution: guard plus switch at the margin. Same answers, flat shape.
// => flat rewrite from Example 68: guards exit, the switch answers
int Price(string dish, int qty) // => flat version: same answers, no pyramid
{
    // => guard first: bad quantity exits before any dish logic runs
    if (qty <= 0) // => inverted condition: failure returns immediately
    {
        return 0; // => early exit keeps the rest flat
    }
    return dish switch // => one expression answers at the left margin
    {
        "rendang" => 25000 * qty, // => the only dish this kitchen prices
        _ => 0, // => unknown dishes total zero, flatly
    };
}
Console.WriteLine(Price("rendang", 2)); // => Output: 50000
