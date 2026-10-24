// => Example 60: Parallel Bounded Forest.
// => MaxDegreeOfParallelism bounds the crew: two cooks, eight stoves to check.
var bag = new System.Collections.Concurrent.ConcurrentBag<string>(); // => thread-safe sack for results

// => ParallelOptions caps the workers at two: the bound is the lesson
var options = new ParallelOptions { MaxDegreeOfParallelism = 2 }; // => two at once, never more
Parallel.ForEach(
    new[] { "rice", "rendang", "sambal", "soto", "gado" },
    options,
    dish => // => five dishes, two cooks
    {
        bag.Add($"{dish} ok"); // => order of arrival varies: sorted below before print
    }
);

// => OrderBy restores a fixed transcript: thread timing never leaks into output
foreach (string line in bag.OrderBy(s => s, StringComparer.Ordinal)) // => ordinal: stable everywhere
{
    Console.WriteLine(line); // => Output: gado ok, rendang ok, rice ok, sambal ok, soto ok
}
