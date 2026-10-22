// => Example 4: List Grows on Add.
// => List<T> starts empty and grows as you Add: read Count, not capacity.
var ledger = new List<string>(); // => target-typed new: the type sits on the left

// => Count reports how many items the list holds right now
Console.WriteLine($"count: {ledger.Count}"); // => Output: count: 0
ledger.Add("rice"); // => first Add: the list grows from empty to one
ledger.Add("rendang"); // => second Add: growth needs no resize call from you

// => Count follows the Adds: two items live in the list now
Console.WriteLine($"count: {ledger.Count}"); // => Output: count: 2

// => Contains asks membership without exposing any index bookkeeping
Console.WriteLine($"has rice: {ledger.Contains("rice")}"); // => Output: has rice: True

// => the indexer reads back exactly what the matching Add stored
Console.WriteLine($"first: {ledger[0]}"); // => Output: first: rice
