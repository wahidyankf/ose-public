// => Example 5: Dictionary Try Get.
// => Dictionaries answer membership plus value in one call: TryGetValue.
var prices = new Dictionary<string, int> // => string keys map to integer prices
{
    ["rice"] = 12000, // => collection expression style would work too; this is explicit
    ["rendang"] = 25000, // => each key appears exactly once in the table
};

// => TryGetValue returns true and hands the value out: no exception path
// => one call replaces the Contains-then-index pair, which reads twice
if (prices.TryGetValue("rice", out int rice)) // => rice receives 12000 on success
{
    Console.WriteLine($"rice: {rice}"); // => Output: rice: 12000
}

// => a missing key returns false instead of throwing: the false branch runs
// => misses stay ordinary outcomes here, never exceptional ones
if (!prices.TryGetValue("sambal", out int missing)) // => missing stays 0, unused
{
    // => the miss branch reads as data handling, not error handling
    Console.WriteLine("sambal: not on the menu"); // => Output: sambal: not on the menu
}
