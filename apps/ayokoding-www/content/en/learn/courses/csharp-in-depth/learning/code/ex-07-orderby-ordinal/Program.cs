// => Example 7: OrderBy Ordinal.
// => OrderBy with an explicit comparer sorts the same on every machine.
var members = new List<(string First, string Last)> // => value tuples pair the names
{
    ("Sari", "Nugroho"), // => sorts second by last name under ordinal rules
    ("budi", "Santoso"), // => lowercase b: ordinal puts uppercase first
    ("Ayu", "Nugroho"), // => ties on last name: the tiebreak decides below
};

// => Ordinal compares code points: stable across cultures and containers
var ordered = members.OrderBy(m => m.Last, StringComparer.Ordinal); // => last name first

// => ThenBy breaks the Nugroho tie by first name, ordinal again
ordered = ordered.ThenBy(m => m.First, StringComparer.Ordinal); // => Ayu before Sari

// => one line per member in the final order: Ayu, Sari, then budi
foreach (var m in ordered) // => the query runs as the loop pulls each row
{
    Console.WriteLine($"{m.First} {m.Last}"); // => Output: Ayu Nugroho / Sari Nugroho / budi Santoso
}
