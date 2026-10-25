// => Example 53: Frozen Lookup Is Fast.
// => FrozenDictionary freezes a lookup table for reads: built once, read fast.
var menu = new Dictionary<string, int> // => mutable builder first, frozen second
{
    ["rice"] = 12000, // => entries land in the builder like any dictionary
    ["rendang"] = 25000, // => second entry joins the builder table
    ["sambal"] = 5000, // => third entry completes the menu
};

// => ToFrozenDictionary snapshots the builder: reads after this never lock
var frozen = System.Collections.Frozen.FrozenDictionary.ToFrozenDictionary(menu); // => frozen: optimized for reads

// => lookups hit the frozen table: same answers, faster shape for hot paths
Console.WriteLine(frozen["rendang"]); // => Output: 25000

// => Count survives the freeze: three entries traveled into the snapshot
Console.WriteLine($"items: {frozen.Count}"); // => Output: items: 3
