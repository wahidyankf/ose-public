// Starter: hand accumulation loop totals the order. The smell: Sum exists.
// => replace the loop with Where plus Sum following Examples 6 and 71
var prices = new Dictionary<string, int>
{
    ["rice"] = 12000,
    ["rendang"] = 25000,
    ["sambal"] = 5000,
}; // => fixed menu
var order = new List<string> { "rice", "rendang", "rice" }; // => two rice plus rendang
int total = 0; // => accumulator the loop below grows by hand
foreach (string dish in order) // => hand walk over the order lines
{
    total += prices[dish]; // => add each looked-up price manually
}
Console.WriteLine(total); // => 49000 today, one expression tomorrow
