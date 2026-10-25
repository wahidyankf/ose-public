// Solution: Sum over looked-up prices. Same total, one expression.
// => LINQ pipeline from Examples 6 and 71: shape, then materialize
var prices = new Dictionary<string, int>
{
    ["rice"] = 12000,
    ["rendang"] = 25000,
    ["sambal"] = 5000,
}; // => fixed menu
var order = new List<string> { "rice", "rendang", "rice" }; // => two rice plus rendang

// => Select looks up each price, Sum totals: the loop above retires entirely
Console.WriteLine(order.Select(dish => prices[dish]).Sum()); // => Output: 49000
