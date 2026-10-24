// => Example 58: Concurrent Dictionary Counts.
// => ConcurrentDictionary counts from many threads: AddOrUpdate is atomic.
var counts = new System.Collections.Concurrent.ConcurrentDictionary<string, int>(); // => thread-safe table
string[] orders = { "rice", "rendang", "rice", "sambal", "rice" }; // => fixed orders, five lines

// => Parallel.ForEach tallies together: no lock needed, updates never collide
Parallel.ForEach(
    orders,
    dish => // => each dish lands on some thread
    {
        // => AddOrUpdate adds 1 fresh or increments: atomic per key, always
        counts.AddOrUpdate(dish, 1, (_, old) => old + 1); // => rice climbs to 3
    }
);

// => sort before printing: thread completion order never reaches the transcript
foreach (var pair in counts.OrderBy(p => p.Key, StringComparer.Ordinal)) // => ordinal: stable everywhere
{
    Console.WriteLine($"{pair.Key}: {pair.Value}"); // => Output: rendang: 1, rice: 3, sambal: 1
}
